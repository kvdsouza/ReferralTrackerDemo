import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertReferralSchema, verifyReferralSchema, userRoles } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  // Get all referrals for the logged in contractor
  app.get("/api/referrals", requireAuth, async (req, res) => {
    const referrals = await storage.getReferrals(req.user!.id);
    res.json(referrals);
  });

  // Generate new referral code for existing homeowner
  app.post("/api/referrals/generate", requireAuth, async (req, res) => {
    try {
      console.log('Referral generation request:', {
        userRole: req.user?.role,
        userId: req.user?.id,
        body: req.body
      });

      // Verify the user is an existing homeowner
      if (req.user!.role !== userRoles.EXISTING_HOMEOWNER) {
        console.log('User role check failed:', req.user!.role);
        return res.status(403).json({ 
          message: "Only existing homeowners can generate referral codes" 
        });
      }

      // Get and validate the contractor ID
      const { contractorId } = req.body;
      if (!contractorId) {
        console.log('Missing contractorId in request body');
        return res.status(400).json({ message: "Contractor ID is required" });
      }

      // Verify contractor exists and has correct role
      const contractor = await storage.getUser(contractorId);
      if (!contractor || contractor.role !== userRoles.CONTRACTOR) {
        console.log('Invalid contractor:', { contractorId, found: !!contractor, role: contractor?.role });
        return res.status(400).json({ message: "Invalid contractor ID" });
      }

      console.log('Creating referral for contractor:', contractorId);
      const referral = await storage.createReferral(contractorId, {
        referrerId: req.user!.id,
        referredCustomerAddress: '',
        installationDate: null
      });

      console.log('Referral created successfully:', referral);
      res.status(201).json(referral);
    } catch (error: any) {
      console.error('Error generating referral:', error);
      res.status(500).json({ message: error.message || "Failed to generate referral code" });
    }
  });

  // Create referral by contractor
  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      // Verify the user is a contractor
      if (req.user!.role !== userRoles.CONTRACTOR) {
        return res.status(403).json({ 
          message: "Only contractors can create referrals" 
        });
      }

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

      // Get the original referral to verify
      const originalReferral = await storage.getReferralByCode(parsed.data.referralCode);
      if (!originalReferral) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      const updated = await storage.updateReferral(originalReferral.id, {
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