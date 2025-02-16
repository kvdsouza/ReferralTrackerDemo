import { pgTable, text, serial, integer, timestamp, boolean, jsonb, numeric } from "drizzle-orm/pg-core";
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

// New tables for analytics and CRM integration
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => users.id),
  eventType: text("event_type").notNull(), // referral_created, referral_converted, etc.
  eventData: jsonb("event_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referralMetrics = pgTable("referral_metrics", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => users.id),
  totalReferrals: integer("total_referrals").notNull().default(0),
  convertedReferrals: integer("converted_referrals").notNull().default(0),
  conversionRate: text("conversion_rate").notNull().default('0'), // Changed to text to store decimal numbers as strings
  averageTimeToConversion: integer("average_time_to_conversion"), // in days
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const crmIntegrations = pgTable("crm_integrations", {
  id: serial("id").primaryKey(),
  contractorId: integer("contractor_id")
    .notNull()
    .references(() => users.id),
  platform: text("platform").notNull(), // salesforce, hubspot, etc.
  credentials: jsonb("credentials").notNull(),
  settings: jsonb("settings").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  enabled: boolean("enabled").notNull().default(true),
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

// New schemas for analytics and CRM
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents)
  .omit({ id: true, createdAt: true });

export const insertCrmIntegrationSchema = createInsertSchema(crmIntegrations)
  .omit({ id: true, createdAt: true, lastSyncAt: true })
  .extend({
    credentials: z.object({
      apiKey: z.string().optional(),
      apiSecret: z.string().optional(),
      refreshToken: z.string().optional(),
      accessToken: z.string().optional(),
    }),
    settings: z.object({
      syncFrequency: z.number().min(1).max(24), // hours
      syncFields: z.array(z.string()),
      automations: z.array(z.object({
        trigger: z.string(),
        action: z.string(),
      })),
    }),
  });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type VerifyReferral = z.infer<typeof verifyReferralSchema>;
export type EducationalMaterial = typeof educationalMaterials.$inferSelect;
export type InsertEducationalMaterial = z.infer<typeof insertEducationalMaterialSchema>;

// New type exports
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type ReferralMetric = typeof referralMetrics.$inferSelect;
export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type InsertCrmIntegration = z.infer<typeof insertCrmIntegrationSchema>;