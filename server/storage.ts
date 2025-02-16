import { users, referrals, type User, type InsertUser, type Referral, type InsertReferral } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getReferrals(contractorId: number): Promise<Referral[]>;
  createReferral(contractorId: number, referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  updateReferral(id: number, data: Partial<Referral>): Promise<Referral>;

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
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison
    return installationDate > today ? "wait for install" : "complete";
  }

  async createReferral(contractorId: number, data: InsertReferral): Promise<Referral> {
    try {
      // Verify contractor exists
      const [contractor] = await db
        .select()
        .from(users)
        .where(eq(users.id, contractorId));

      if (!contractor) {
        throw new Error("Contractor not found");
      }

      // Generate a unique referral code
      const referralCode = Math.random().toString(36).substring(2, 12).toUpperCase();

      // Create the referral with all required fields
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

      return referral;
    } catch (error: any) {
      console.error('Error creating referral:', error);
      throw error;
    }
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
    // Check if the referral exists
    const [existingReferral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, id));

    if (!existingReferral) {
      throw new Error("Referral not found");
    }

    // Check for duplicate referred address
    if (data.referredCustomerAddress) {
      const [duplicateAddress] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredCustomerAddress, data.referredCustomerAddress));

      if (duplicateAddress) {
        throw new Error("This referred address is already registered");
      }
    }

    // Calculate status based on installation date
    const status = this.calculateStatus(
      data.installationDate || existingReferral.installationDate
    );

    // Update the referral
    const [updated] = await db
      .update(referrals)
      .set({ ...data, status })
      .where(eq(referrals.id, id))
      .returning();

    return updated;
  }
}

export const storage = new DatabaseStorage();