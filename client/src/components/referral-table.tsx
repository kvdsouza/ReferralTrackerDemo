import { useQuery } from "@tanstack/react-query";
import type { Referral } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ReferralTable() {
  const { data: referrals, isLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referrals"],
  });

  if (isLoading) {
    return <ReferralTableSkeleton />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Referral Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Referred Customer</TableHead>
            <TableHead>Installation Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals?.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell>{referral.customerName}</TableCell>
              <TableCell>{referral.customerEmail}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-2 py-1">
                  {referral.referralCode}
                </code>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={referral.verified ? "success" : "secondary"}
                >
                  {referral.status}
                </Badge>
              </TableCell>
              <TableCell>{referral.referredCustomerName || "-"}</TableCell>
              <TableCell>
                {referral.installationDate
                  ? format(new Date(referral.installationDate), "PP")
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
          {referrals?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No referrals yet. Generate a code to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReferralTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Referral Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Referred Customer</TableHead>
            <TableHead>Installation Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(3)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(6)].map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
