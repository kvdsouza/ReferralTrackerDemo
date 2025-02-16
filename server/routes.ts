import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertReferralSchema, verifyReferralSchema, userRoles, insertUserSchema } from "@shared/schema";
import { bulkHomeownerImportSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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

  // Sample data generation endpoint (development only)
  app.post("/api/dev/generate-sample-data", async (req, res) => {
    try {
      // Create contractors
      const contractors = await Promise.all([
        storage.createUser({
          username: "solarco",
          password: await hashPassword("contractor123"),
          email: "contact@solarco.com",
          role: userRoles.CONTRACTOR,
          companyName: "SolarCo Systems",
          businessInfo: {
            description: "Leading solar installation company",
            phone: "555-0123"
          }
        }),
        storage.createUser({
          username: "greentech",
          password: await hashPassword("contractor123"),
          email: "info@greentech.com",
          role: userRoles.CONTRACTOR,
          companyName: "GreenTech Solar",
          businessInfo: {
            description: "Sustainable energy solutions",
            phone: "555-0124"
          }
        })
      ]);

      // Create existing homeowners
      const homeownersData = [
        {
          username: "john_doe",
          email: "john@example.com",
          password: await hashPassword("homeowner123"),
          address: "123 Solar St, San Francisco, CA",
          contractorId: contractors[0].id
        },
        {
          username: "alice_smith",
          email: "alice@example.com",
          password: await hashPassword("homeowner123"),
          address: "456 Green Ave, San Francisco, CA",
          contractorId: contractors[0].id
        },
        {
          username: "bob_wilson",
          email: "bob@example.com",
          password: await hashPassword("homeowner123"),
          address: "789 Energy Blvd, San Francisco, CA",
          contractorId: contractors[1].id
        }
      ];

      const homeowners = await Promise.all(
        homeownersData.map(data => 
          storage.createUser({
            ...data,
            role: userRoles.EXISTING_HOMEOWNER,
          })
        )
      );

      // Generate referrals for each homeowner
      const referrals = await Promise.all([
        storage.createReferral(contractors[0].id, {
          referrerId: homeowners[0].id,
          referredCustomerAddress: "321 New St, San Francisco, CA",
          installationDate: new Date("2024-03-01")
        }),
        storage.createReferral(contractors[0].id, {
          referrerId: homeowners[1].id,
          referredCustomerAddress: "654 Fresh Ave, San Francisco, CA",
          installationDate: new Date("2024-03-15")
        }),
        storage.createReferral(contractors[1].id, {
          referrerId: homeowners[2].id,
          referredCustomerAddress: "987 Solar Way, San Francisco, CA",
          installationDate: new Date("2024-04-01")
        })
      ]);

      res.status(201).json({
        message: "Sample data generated successfully",
        data: {
          contractors,
          homeowners,
          referrals
        }
      });
    } catch (error: any) {
      console.error('Error generating sample data:', error);
      res.status(500).json({ message: error.message });
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