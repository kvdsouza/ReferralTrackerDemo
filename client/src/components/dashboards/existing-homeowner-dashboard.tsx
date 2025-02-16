import { useQuery } from "@tanstack/react-query";
import type { Referral } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ExistingHomeownerDashboard() {
  const { user } = useAuth();
  const { data: referrals } = useQuery<Referral[]>({
    queryKey: ["/api/referrals/my-referrals"],
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Referrals</h2>
        <p className="text-muted-foreground">
          Track the status of your referrals and rewards.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-lg rounded bg-muted px-2 py-1">
            {user.referralCode || "Request a referral code from your contractor"}
          </code>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referred Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Installation Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals?.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>{referral.referredCustomerAddress || "Pending"}</TableCell>
                <TableCell>
                  <Badge variant={referral.verified ? "outline" : "secondary"}>
                    {referral.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {referral.installationDate
                    ? format(new Date(referral.installationDate), "PP")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
            {(!referrals || referrals.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No referrals yet. Share your referral code to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}