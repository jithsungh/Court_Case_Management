
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext"; // Use FirebaseAuthContext
import { Case } from "@/services/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { formatTimestamp, timestampToDate } from "@/utils/dateUtils";

export function RecentCases() {
  const { userData } = useFirebaseAuth(); // Use userData from FirebaseAuthContext
  const { cases } = useData();

  if (!userData) return null;

  let userCases = [];

  if (userData.role === "client") {
    userCases = cases.filter((c) => c.clientId === userData.id);
  } else if (userData.role === "lawyer") {
    userCases = cases.filter((c) => c.lawyerId === userData.id);
  } else {
    userCases = cases; // Clerks and judges see all cases
  }

  // Sort by most recently updated
  const recentCases = [...userCases]
    .filter((c) => c.updatedAt) // Make sure updatedAt exists
    .sort((a, b) => {
      const dateA = a.updatedAt ? (timestampToDate(a.updatedAt)?.getTime() || 0) : 0;
      const dateB = b.updatedAt ? (timestampToDate(b.updatedAt)?.getTime() || 0) : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Cases</CardTitle>
        <CardDescription>Your most recently updated cases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentCases.length > 0 ? (
            recentCases.map((caseItem) => (
              <CaseCard key={caseItem.id} caseItem={caseItem} />
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No cases found
            </p>
          )}
        </div>
        {recentCases.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/cases">View All Cases</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CaseCardProps {
  caseItem: Case;
}

function CaseCard({ caseItem }: CaseCardProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    active: "bg-green-100 text-green-800 hover:bg-green-200",
    scheduled: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    in_progress: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    on_hold: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    dismissed: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    closed: "bg-red-100 text-red-800 hover:bg-red-200",
  };

  const status = caseItem.status || "pending";
  const statusColor = statusColors[status] || statusColors.pending;

  return (
    <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium mb-1">
            {caseItem.title || "Untitled Case"}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            Case #{caseItem.caseNumber || "N/A"}
          </p>
        </div>
        <Badge className={statusColor}>{status.replace("_", " ")}</Badge>
      </div>
      <p className="text-sm line-clamp-2 mb-2">
        {caseItem.description || "No description available"}
      </p>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-muted-foreground">
          {caseItem.updatedAt
            ? `Updated ${formatTimestamp(caseItem.updatedAt)}`
            : "Updated: unknown"}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/cases/${caseItem.id}`}>View Case</Link>
        </Button>
      </div>
    </div>
  );
}
