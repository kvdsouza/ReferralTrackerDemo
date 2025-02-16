import { users, referrals, educationalMaterials, type User, type InsertUser, type Referral, type InsertReferral, type EducationalMaterial, type InsertEducationalMaterial } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { userRoles } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getReferrals(contractorId: number): Promise<Referral[]>;
  createReferral(contractorId: number, referral: InsertReferral): Promise<Referral>;
  getReferralByCode(code: string): Promise<Referral | undefined>;
  updateReferral(id: number, data: Partial<Referral>): Promise<Referral>;

  createEducationalMaterial(contractorId: number, material: InsertEducationalMaterial): Promise<EducationalMaterial>;
  getEducationalMaterials(contractorId: number): Promise<EducationalMaterial[]>;

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

  async createReferral(contractorId: number, data: InsertReferral): Promise<Referral> {
    try {
      // Verify contractor exists
      const [contractor] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, contractorId),
          eq(users.role, userRoles.CONTRACTOR)
        ));

      if (!contractor) {
        throw new Error("Invalid contractor ID or user is not a contractor");
      }

      // Verify referrer exists and is associated with this contractor
      const [referrer] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.id, data.referrerId),
          eq(users.contractorId, contractorId),
          eq(users.role, userRoles.EXISTING_HOMEOWNER)
        ));

      if (!referrer) {
        throw new Error("Referrer must be an existing homeowner associated with this contractor");
      }

      // Generate a unique referral code that includes contractor identifier
      const contractorPrefix = contractor.companyName
        ? contractor.companyName.substring(0, 3).toUpperCase()
        : 'REF';
      const uniqueId = Math.random().toString(36).substring(2, 7).toUpperCase();
      const referralCode = `${contractorPrefix}-${uniqueId}`;

      // Create the referral
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
      .where(eq(referrals.referralCode, code));
    return referral;
  }

  async updateReferral(id: number, data: Partial<Referral>): Promise<Referral> {
    const [updated] = await db
      .update(referrals)
      .set(data)
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async createEducationalMaterial(contractorId: number, material: InsertEducationalMaterial): Promise<EducationalMaterial> {
    const [created] = await db
      .insert(educationalMaterials)
      .values({
        ...material,
        contractorId,
      })
      .returning();
    return created;
  }

  async getEducationalMaterials(contractorId: number): Promise<EducationalMaterial[]> {
    return await db
      .select()
      .from(educationalMaterials)
      .where(eq(educationalMaterials.contractorId, contractorId));
  }
}

export const storage = new DatabaseStorage();