
import { useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case, CaseStatus } from "@/services/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { FileText, FileWarning, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/utils/dateUtils";

// Status badges config
const STATUS_BADGES: Record<CaseStatus, { color: string; text: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
  active: { color: "bg-green-100 text-green-800", text: "Active" },
  filed: { color: "bg-blue-100 text-blue-800", text: "Filed" },
  scheduled: { color: "bg-purple-100 text-purple-800", text: "Scheduled" },
  in_progress: { color: "bg-cyan-100 text-cyan-800", text: "In Progress" },
  on_hold: { color: "bg-orange-100 text-orange-800", text: "On Hold" },
  dismissed: { color: "bg-red-100 text-red-800", text: "Dismissed" },
  closed: { color: "bg-gray-100 text-gray-800", text: "Closed" },
};

export const LawyerCaseList = () => {
  const { userData } = useFirebaseAuth();
  const { getCasesByUserId } = useFirebaseData();
  const [loading, setLoading] = useState(true);
  const [plaintiffCases, setPlaintiffCases] = useState<Case[]>([]);
  const [defenseCases, setDefenseCases] = useState<Case[]>([]);
  const [activeTab, setActiveTab] = useState("plaintiff");

  useState(() => {
    const fetchCases = async () => {
      if (!userData?.id) return;
      setLoading(true);
      
      try {
        // Get all cases related to the lawyer
        const allLawyerCases = await getCasesByUserId(userData.id);
        
        // Split cases into plaintiff cases and defense cases
        const plaintiffCases = allLawyerCases.filter(c => c.lawyerId === userData.id);
        const defenseCases = allLawyerCases.filter(c => c.defendantLawyerId === userData.id);
        
        setPlaintiffCases(plaintiffCases);
        setDefenseCases(defenseCases);
      } catch (error) {
        console.error("Error fetching lawyer cases:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCases();
  });

  if (!userData) return null;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plaintiff" className="relative">
            Plaintiff Cases
            {plaintiffCases.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {plaintiffCases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="defense" className="relative">
            Defense Cases
            {defenseCases.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {defenseCases.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plaintiff" className="mt-6">
          {plaintiffCases.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">No Plaintiff Cases</p>
                  <p className="text-muted-foreground mt-2">You don't have any cases where you're representing a plaintiff.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {plaintiffCases.map((caseItem) => (
                <Card key={caseItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{caseItem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Case #{caseItem.caseNumber || "N/A"}
                        </CardDescription>
                      </div>
                      {caseItem.status && (
                        <Badge className={STATUS_BADGES[caseItem.status].color}>
                          {STATUS_BADGES[caseItem.status].text}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Filed Date</h3>
                      <p className="mt-1 text-sm">{formatTimestamp(caseItem.filedDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Plaintiff</h3>
                      <p className="mt-1 text-sm">{caseItem.plaintiff?.name || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Defendant</h3>
                      <p className="mt-1 text-sm">{caseItem.defendant?.name || "N/A"}</p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/cases/${caseItem.id}`}>View Case Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="defense" className="mt-6">
          {defenseCases.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <FileWarning className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">No Defense Cases</p>
                  <p className="text-muted-foreground mt-2">You don't have any cases where you're representing a defendant.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {defenseCases.map((caseItem) => (
                <Card key={caseItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{caseItem.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Case #{caseItem.caseNumber || "N/A"}
                        </CardDescription>
                      </div>
                      {caseItem.status && (
                        <Badge className={STATUS_BADGES[caseItem.status].color}>
                          {STATUS_BADGES[caseItem.status].text}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Filed Date</h3>
                      <p className="mt-1 text-sm">{formatTimestamp(caseItem.filedDate)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Plaintiff</h3>
                      <p className="mt-1 text-sm">{caseItem.plaintiff?.name || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Defendant</h3>
                      <p className="mt-1 text-sm">{caseItem.defendant?.name || "N/A"}</p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to={`/cases/${caseItem.id}`}>View Case Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
