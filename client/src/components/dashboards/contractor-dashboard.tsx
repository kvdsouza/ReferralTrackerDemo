import { useQuery } from "@tanstack/react-query";
import type { Referral, EducationalMaterial } from "@shared/schema";
import ReferralTable from "@/components/referral-table";
import GenerateCode from "@/components/generate-code";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ContractorDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contractor Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your referrals and educational materials.
          </p>
        </div>
        
        <div className="flex gap-4">
          <GenerateCode />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Educational Material
          </Button>
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Referrals</h3>
          <ReferralTable />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Educational Materials</h3>
          {/* Educational materials table will go here */}
        </div>
      </div>
    </div>
  );
}
