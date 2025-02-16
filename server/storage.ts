import { 
  users, referrals, analyticsEvents, referralMetrics, crmIntegrations,
  type User, type InsertUser, type Referral, type InsertReferral,
  type AnalyticsEvent, type InsertAnalyticsEvent, type ReferralMetric,
  type CrmIntegration, type InsertCrmIntegration
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { randomBytes } from "crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getReferrals(contractorId: number): Promise<Referral[]>;
  createReferral(contractorId: number, referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  updateReferral(id: number, data: Partial<Referral>): Promise<Referral>;
  trackAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalytics(contractorId: number): Promise<ReferralMetric>;
  updateReferralMetrics(contractorId: number): Promise<ReferralMetric>; 
  createCrmIntegration(integration: InsertCrmIntegration): Promise<CrmIntegration>;
  getCrmIntegration(contractorId: number, platform: string): Promise<CrmIntegration | undefined>;
  updateCrmIntegration(id: number, data: Partial<CrmIntegration>): Promise<CrmIntegration>;
  syncWithCrm(contractorId: number, platform: string): Promise<void>;
  generateUniqueReferralCode(): Promise<string>; // Added to interface
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  private generateReferralCode(): string {
    const bytes = randomBytes(6);
    return bytes.toString('hex')
      .substring(0, 10)
      .toUpperCase();
  }

  async generateUniqueReferralCode(): Promise<string> {
    for (let attempts = 0; attempts < 3; attempts++) {
      const code = this.generateReferralCode();
      // Check if code already exists
      const [existing] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referralCode, code));

      if (!existing) {
        return code;
      }
    }
    throw new Error("Failed to generate unique referral code after 3 attempts");
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getReferrals(contractorId: number): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.contractorId, contractorId));
  }

  private calculateStatus(installationDate: Date | null): string {
    if (!installationDate) return "pending";
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return installationDate > today ? "wait for install" : "complete";
  }

  async createReferral(contractorId: number, data: InsertReferral): Promise<Referral> {
    const referralCode = await this.generateUniqueReferralCode();

    const [referral] = await db
      .insert(referrals)
      .values({
        ...data,
        contractorId,
        referralCode,
        status: "pending",
        verified: false,
      })
      .returning();

    // Track analytics event for referral creation
    await this.trackAnalyticsEvent({
      contractorId,
      eventType: 'referral_created',
      eventData: {
        referralId: referral.id,
        referralCode: referral.referralCode,
        timestamp: new Date().toISOString()
      }
    });

    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referralCode, code),
          eq(referrals.verified, false)
        )
      );
    return referral;
  }

  async updateReferral(id: number, data: Partial<Referral>): Promise<Referral> {
    const [existingReferral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, id));

    if (!existingReferral) {
      throw new Error("Referral not found");
    }

    if (data.referredCustomerAddress) {
      const [duplicateAddress] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredCustomerAddress, data.referredCustomerAddress));

      if (duplicateAddress) {
        throw new Error("This referred address is already registered");
      }
    }

    const status = this.calculateStatus(
      data.installationDate || existingReferral.installationDate
    );

    const [updated] = await db
      .update(referrals)
      .set({ ...data, status })
      .where(eq(referrals.id, id))
      .returning();

    return updated;
  }

  async trackAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [analyticsEvent] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();

    await this.updateReferralMetrics(event.contractorId);
    return analyticsEvent;
  }

  async getAnalytics(contractorId: number): Promise<ReferralMetric> {
    const [metrics] = await db
      .select()
      .from(referralMetrics)
      .where(eq(referralMetrics.contractorId, contractorId));

    if (!metrics) {
      return await this.updateReferralMetrics(contractorId);
    }

    return metrics;
  }

  async updateReferralMetrics(contractorId: number): Promise<ReferralMetric> {
    const referralsList = await this.getReferrals(contractorId);

    const total = referralsList.length;
    const converted = referralsList.filter(r => r.status === "complete").length;
    const conversionRate = (total > 0 ? (converted / total) * 100 : 0).toFixed(2); 

    const conversionTimes = referralsList
      .filter(r => r.status === "complete" && r.installationDate)
      .map(r => {
        const created = new Date(r.createdAt);
        const installed = r.installationDate ? new Date(r.installationDate) : null;
        if (!installed) return 0;
        return Math.floor((installed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });

    const avgTime = conversionTimes.length > 0
      ? Math.floor(conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length)
      : null;

    const [metrics] = await db
      .insert(referralMetrics)
      .values({
        contractorId: contractorId,
        totalReferrals: total,
        convertedReferrals: converted,
        conversionRate: conversionRate,
        averageTimeToConversion: avgTime,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [referralMetrics.contractorId],
        set: {
          totalReferrals: total,
          convertedReferrals: converted,
          conversionRate: conversionRate,
          averageTimeToConversion: avgTime,
          updatedAt: new Date(),
        },
      })
      .returning();

    return metrics;
  }

  async createCrmIntegration(integration: InsertCrmIntegration): Promise<CrmIntegration> {
    const [crmIntegration] = await db
      .insert(crmIntegrations)
      .values(integration)
      .returning();
    return crmIntegration;
  }

  async getCrmIntegration(contractorId: number, platform: string): Promise<CrmIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(crmIntegrations)
      .where(
        and(
          eq(crmIntegrations.contractorId, contractorId),
          eq(crmIntegrations.platform, platform)
        )
      );
    return integration;
  }

  async updateCrmIntegration(id: number, data: Partial<CrmIntegration>): Promise<CrmIntegration> {
    const [updated] = await db
      .update(crmIntegrations)
      .set({ ...data, lastSyncAt: new Date() })
      .where(eq(crmIntegrations.id, id))
      .returning();
    return updated;
  }

  async syncWithCrm(contractorId: number, platform: string): Promise<void> {
    const integration = await this.getCrmIntegration(contractorId, platform);
    if (!integration || !integration.enabled) return;

    await this.updateCrmIntegration(integration.id, { lastSyncAt: new Date() });
  }
}

export const storage = new DatabaseStorage();