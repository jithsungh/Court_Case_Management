
import { useEffect, useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case } from "@/services/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { LawyerCaseList } from "./LawyerCaseList";
import { formatTimestamp } from "@/utils/dateUtils";

export const CaseList = () => {
  const { userData } = useFirebaseAuth();
  const { getCasesByUserId } = useFirebaseData();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      if (!userData?.id) return;
      
      setLoading(true);
      try {
        const userCases = await getCasesByUserId(userData.id);
        setCases(userCases);
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, [userData, getCasesByUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading cases...</p>
      </div>
    );
  }

  // For lawyers, use the LawyerCaseList component with tabs for plaintiff and defense cases
  if (userData?.role === "lawyer") {
    return <LawyerCaseList />;
  }

  // For clients, show their cases
  if (cases.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No Cases Found</p>
            <p className="text-muted-foreground mt-2">You don't have any active cases yet.</p>
            {userData?.role === "client" && (
              <Button asChild className="mt-4">
                <Link to="/find-lawyer">Find a Lawyer</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cases.map((caseItem) => (
        <Card key={caseItem.id} className="flex flex-col">
          <div className="p-6">
            <h3 className="text-lg font-semibold">{caseItem.title}</h3>
            <p className="text-muted-foreground mt-1">
              Case #{caseItem.caseNumber || "Pending"}
            </p>
            
            <div className="space-y-2 mt-4">
              <div>
                <span className="text-sm font-medium">Status:</span>
                <span className="text-sm ml-2 capitalize">{caseItem.status}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium">Filed:</span>
                <span className="text-sm ml-2">
                  {formatTimestamp(caseItem.filedDate)}
                </span>
              </div>
              
              {caseItem.nextHearingDate && (
                <div>
                  <span className="text-sm font-medium">Next Hearing:</span>
                  <span className="text-sm ml-2">
                    {formatTimestamp(caseItem.nextHearingDate)}
                  </span>
                </div>
              )}
            </div>

            <Button asChild className="w-full mt-6">
              <Link to={`/cases/${caseItem.id}`}>View Details</Link>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
