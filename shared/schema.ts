import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoles = {
  CONTRACTOR: 'contractor',
  EXISTING_HOMEOWNER: 'existing_homeowner',
  REFERRED_HOMEOWNER: 'referred_homeowner',
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  // Contractor specific fields
  companyName: text("company_name"),
  businessInfo: jsonb("business_info"), // Store company description, contact info, etc.
  // Homeowner specific fields
  address: text("address"),
  installationDate: timestamp("installation_date"),
  referralCode: text("referral_code"), // For existing homeowners
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => users.id),
  referrerId: integer("referrer_id")
    .notNull()
    .references(() => users.id), // Existing homeowner who refers
  referredId: integer("referred_id")
    .references(() => users.id), // New homeowner being referred
  referralCode: text("referral_code").notNull(),
  status: text("status").notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  installationDate: timestamp("installation_date"),
  referredCustomerAddress: text("referred_customer_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const educationalMaterials = pgTable("educational_materials", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ['pdf', 'video', 'text'] }).notNull(),
  content: text("content").notNull(), // URL for videos/PDFs, or actual content for text
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for data insertion and validation
export const insertUserSchema = createInsertSchema(users)
  .extend({
    confirmPassword: z.string(),
    role: z.enum([userRoles.CONTRACTOR, userRoles.EXISTING_HOMEOWNER, userRoles.REFERRED_HOMEOWNER]),
  })
  .omit({ createdAt: true, referralCode: true })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const insertReferralSchema = createInsertSchema(referrals)
  .omit({ 
    id: true,
    contractorId: true,
    referredId: true,
    referralCode: true,
    status: true,
    verified: true,
    createdAt: true 
  });

export const verifyReferralSchema = z.object({
  referralCode: z.string(),
  referredCustomerAddress: z.string(),
  installationDate: z.string(),
});

export const insertEducationalMaterialSchema = createInsertSchema(educationalMaterials)
  .omit({ id: true, createdAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type VerifyReferral = z.infer<typeof verifyReferralSchema>;
export type EducationalMaterial = typeof educationalMaterials.$inferSelect;
export type InsertEducationalMaterial = z.infer<typeof insertEducationalMaterialSchema>;