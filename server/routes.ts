import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertReferralSchema, verifyReferralSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // Get all referrals for the logged in contractor
  app.get("/api/referrals", requireAuth, async (req, res) => {
    const referrals = await storage.getReferrals(req.user!.id);
    res.json(referrals);
  });

  // Generate new referral code
  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      const parsed = insertReferralSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const referral = await storage.createReferral(req.user!.id, parsed.data);
      res.status(201).json(referral);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Verify referral
  app.post("/api/referrals/verify", requireAuth, async (req, res) => {
    try {
      const parsed = verifyReferralSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Get the original referral to copy customer details
      const originalReferral = await storage.getReferralByCode(parsed.data.referralCode);
      if (!originalReferral) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // Create a new referral record with the same code but new referred address
      const newReferral = await storage.createReferral(req.user!.id, {
        customerAddress: originalReferral.customerAddress,
        customerEmail: originalReferral.customerEmail,
      });

      // Update the new referral with verification details
      const updated = await storage.updateReferral(newReferral.id, {
        referralCode: originalReferral.referralCode,
        referredCustomerAddress: parsed.data.referredCustomerAddress,
        installationDate: new Date(parsed.data.installationDate),
        verified: true,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}