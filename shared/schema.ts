import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  installationDate: timestamp("installation_date"),
  referredCustomerName: text("referred_customer_name"),
  status: text("status").notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertReferralSchema = createInsertSchema(referrals).pick({
  customerName: true,
  customerEmail: true,
});

export const verifyReferralSchema = z.object({
  referralCode: z.string(),
  referredCustomerName: z.string(),
  installationDate: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type VerifyReferral = z.infer<typeof verifyReferralSchema>;
