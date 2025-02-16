import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { userRoles, type Referral } from "@shared/schema";
import { useState, useEffect } from "react";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  // Show modal when user logs in
  useEffect(() => {
    if (user) {
      setOpen(true);
    }
  }, [user]);

  // Fetch referrals data
  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ['/api/referrals'],
    enabled: !!user,
  });

  if (!user) return null;

  const completedReferrals = referrals?.filter(r => r.status === 'complete').length || 0;
  const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
  const totalReferrals = referrals?.length || 0;
  const progress = totalReferrals ? (completedReferrals / totalReferrals) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome back, {user.username}!</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {user.role === userRoles.CONTRACTOR ? (
            <div className="space-y-4">
              <h3 className="font-medium">Your Referral Network</h3>
              <div className="space-y-2">
                <p>Total Referrals: {totalReferrals}</p>
                <p>Completed Installations: {completedReferrals}</p>
                <p>Pending Referrals: {pendingReferrals}</p>
              </div>
              <div className="space-y-2">
                <p>Network Growth</p>
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          ) : user.role === userRoles.EXISTING_HOMEOWNER ? (
            <div className="space-y-4">
              <h3 className="font-medium">Your Referral Progress</h3>
              <div className="space-y-2">
                <p>Active Referrals: {totalReferrals}</p>
                <p>Successful Referrals: {completedReferrals}</p>
              </div>
              <div className="space-y-2">
                <p>Referral Success Rate</p>
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Welcome to Our Referral Network</h3>
              <p>Thank you for joining! Your installation journey begins here.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
