import { useAuth } from "@/hooks/use-auth";
import { userRoles } from "@shared/schema";
import ContractorDashboard from "@/components/dashboards/contractor-dashboard";
import ExistingHomeownerDashboard from "@/components/dashboards/existing-homeowner-dashboard";
import ReferredHomeownerDashboard from "@/components/dashboards/referred-homeowner-dashboard";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">ReferralTrack</h1>
            {user.role === userRoles.CONTRACTOR && (
              <span className="text-muted-foreground">{user.companyName}</span>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user.role === userRoles.CONTRACTOR && <ContractorDashboard />}
        {user.role === userRoles.EXISTING_HOMEOWNER && <ExistingHomeownerDashboard />}
        {user.role === userRoles.REFERRED_HOMEOWNER && <ReferredHomeownerDashboard />}
      </main>
    </div>
  );
}