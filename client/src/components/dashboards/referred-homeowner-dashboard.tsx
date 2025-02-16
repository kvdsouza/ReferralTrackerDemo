import { useQuery } from "@tanstack/react-query";
import type { EducationalMaterial } from "@shared/schema";
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
import { FileText, Video, FileCode } from "lucide-react";

export default function ReferredHomeownerDashboard() {
  const { user } = useAuth();
  const { data: materials } = useQuery<EducationalMaterial[]>({
    queryKey: ["/api/materials"],
  });

  if (!user) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <FileCode className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome!</h2>
        <p className="text-muted-foreground">
          Learn more about our services and track your installation progress.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Installation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              {user.installationDate ? (
                <>
                  Your installation is scheduled for{" "}
                  <span className="font-medium text-foreground">
                    {format(new Date(user.installationDate), "PPP")}
                  </span>
                </>
              ) : (
                "No installation scheduled yet"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Educational Materials</h3>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials?.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIcon(material.type)}
                      <span className="capitalize">{material.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{material.title}</TableCell>
                  <TableCell>{material.description}</TableCell>
                </TableRow>
              ))}
              {(!materials || materials.length === 0) && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No educational materials available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
