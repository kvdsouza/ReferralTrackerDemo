import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertReferralSchema, verifyReferralSchema, userRoles } from "@shared/schema";
import { bulkHomeownerImportSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // Get all referrals for the logged in contractor
  app.get("/api/referrals", requireAuth, async (req, res) => {
    try {
      const referrals = await storage.getReferrals(req.user!.id);
      res.json(referrals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate new referral code for existing homeowner
  app.post("/api/referrals/generate", requireAuth, async (req, res) => {
    try {
      // Verify the user is an existing homeowner
      if (req.user!.role !== userRoles.EXISTING_HOMEOWNER) {
        return res.status(403).json({ 
          message: "Only existing homeowners can generate referral codes" 
        });
      }

      // Get and validate the contractor ID
      const { contractorId } = req.body;
      if (!contractorId) {
        return res.status(400).json({ message: "Contractor ID is required" });
      }

      // Verify contractor exists and has correct role
      const contractor = await storage.getUser(contractorId);
      if (!contractor || contractor.role !== userRoles.CONTRACTOR) {
        return res.status(400).json({ message: "Invalid contractor ID" });
      }

      // Verify the homeowner is associated with this contractor
      if (req.user!.contractorId !== contractorId) {
        return res.status(403).json({ 
          message: "You can only generate referral codes for your assigned contractor" 
        });
      }

      const referral = await storage.createReferral(contractorId, {
        referrerId: req.user!.id,
        referredCustomerAddress: '',
        installationDate: null
      });

      res.status(201).json(referral);
    } catch (error: any) {
      console.error('Error generating referral:', error);
      res.status(500).json({ message: error.message || "Failed to generate referral code" });
    }
  });

  // Create referral by contractor
  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== userRoles.CONTRACTOR) {
        return res.status(403).json({ message: "Only contractors can create referrals" });
      }

      const parsed = insertReferralSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid referral data", errors: parsed.error.errors });
      }

      // Verify the referrer exists and is associated with this contractor
      const referrer = await storage.getUser(parsed.data.referrerId);
      if (!referrer || referrer.contractorId !== req.user!.id) {
        return res.status(400).json({ message: "Invalid referrer ID" });
      }

      const referral = await storage.createReferral(req.user!.id, parsed.data);
      res.status(201).json(referral);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Add educational material
  app.post("/api/educational-materials", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== userRoles.CONTRACTOR) {
        return res.status(403).json({
          message: "Only contractors can add educational materials"
        });
      }

      const material = await storage.createEducationalMaterial(req.user!.id, req.body);
      res.status(201).json(material);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get educational materials
  app.get("/api/educational-materials", requireAuth, async (req, res) => {
    try {
      const materials = await storage.getEducationalMaterials(req.user!.id);
      res.json(materials);
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

      const referral = await storage.getReferralByCode(parsed.data.referralCode);
      if (!referral) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      // Verify the contractor is authorized to verify this referral
      if (referral.contractorId !== req.user!.id) {
        return res.status(403).json({ message: "You are not authorized to verify this referral" });
      }

      const updated = await storage.updateReferral(referral.id, {
        referredCustomerAddress: parsed.data.referredCustomerAddress,
        installationDate: new Date(parsed.data.installationDate),
        verified: true,
        status: 'complete'
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Bulk import existing homeowners
  app.post("/api/homeowners/bulk-import", requireAuth, async (req, res) => {
    try {
      if (req.user!.role !== userRoles.CONTRACTOR) {
        return res.status(403).json({
          message: "Only contractors can import homeowners"
        });
      }

      const parsed = bulkHomeownerImportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid import data",
          errors: parsed.error.errors
        });
      }

      const results = await storage.bulkImportHomeowners(req.user!.id, parsed.data);

      res.status(201).json({
        message: `Successfully imported ${results.length} homeowners`,
        importedUsers: results
      });
    } catch (error: any) {
      console.error('Bulk import failed:', error);
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}