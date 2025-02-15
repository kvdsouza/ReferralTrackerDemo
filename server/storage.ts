import { type User, type InsertUser, type Referral, type InsertReferral } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private referrals: Map<number, Referral>;
  private currentUserId: number;
  private currentReferralId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.referrals = new Map();
    this.currentUserId = 1;
    this.currentReferralId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async getReferrals(contractorId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (ref) => ref.contractorId === contractorId,
    );
  }

  private calculateStatus(installationDate: Date | null): string {
    if (!installationDate) return "pending";
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for date comparison
    return installationDate > today ? "wait for install" : "complete";
  }

  async createReferral(contractorId: number, data: InsertReferral): Promise<Referral> {
    // Check for duplicate referred address
    const existingReferrals = await this.getReferrals(contractorId);
    const hasDuplicateAddress = existingReferrals.some(
      ref => ref.customerAddress === data.customerAddress
    );

    if (hasDuplicateAddress) {
      throw new Error("This customer address already has a referral code");
    }

    const id = this.currentReferralId++;
    const referral: Referral = {
      id,
      contractorId,
      referralCode: nanoid(10),
      installationDate: null,
      referredCustomerAddress: null,
      status: "pending",
      verified: false,
      ...data,
    };
    this.referrals.set(id, referral);
    return referral;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    return Array.from(this.referrals.values()).find(
      (ref) => ref.referralCode === code,
    );
  }

  async updateReferral(id: number, data: Partial<Referral>): Promise<Referral> {
    const referral = this.referrals.get(id);
    if (!referral) throw new Error("Referral not found");

    // If we're updating the referred address, check for uniqueness
    if (data.referredCustomerAddress) {
      const existingReferrals = await this.getReferrals(referral.contractorId);
      const hasDuplicateAddress = existingReferrals.some(
        ref => ref.id !== id && ref.referredCustomerAddress === data.referredCustomerAddress
      );

      if (hasDuplicateAddress) {
        throw new Error("This referred address is already registered");
      }
    }

    const status = this.calculateStatus(data.installationDate || referral.installationDate);
    const updated = { ...referral, ...data, status };
    this.referrals.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();