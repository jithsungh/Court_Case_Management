
import { useEffect, useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case } from "@/services/types";
import { CaseCards } from "@/components/cases/CaseCards";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RequestDefenseLawyer } from "@/components/cases/RequestDefenseLawyer";

export const DefenseCaseList = () => {
  const [defenseCases, setDefenseCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const { getAllCases } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDefenseCases = async () => {
      try {
        setLoading(true);
        const allCases = await getAllCases();
        // Filter cases where current user is defendant and no lawyer is assigned yet
        const userDefenseCases = allCases.filter(
          (caseItem) => 
            caseItem.defendant?.phoneNumber === userData?.phoneNumber &&
            !caseItem.defendantLawyerId
        );
        setDefenseCases(userDefenseCases);
      } catch (error) {
        console.error("Error fetching defense cases:", error);
        toast({
          title: "Error",
          description: "Failed to fetch defense cases. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userData?.phoneNumber) {
      fetchDefenseCases();
    }
  }, [userData, getAllCases]);

  const handleFindLawyer = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setShowRequestDialog(true);
  };

  const renderActionButton = (caseItem: Case) => {
    if (caseItem.defendantLawyerId) {
      return (
        <Button variant="outline" disabled>
          <Shield className="h-4 w-4 mr-2" />
          Lawyer Assigned
        </Button>
      );
    }
    
    return (
      <Button 
        onClick={() => handleFindLawyer(caseItem)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Find Lawyer
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Defense Cases</h1>
        <p className="text-muted-foreground">Manage cases where you are named as defendant</p>
      </div>

      <CaseCards
        cases={defenseCases}
        title="Defense Cases"
        actionButton={renderActionButton}
      />
      
      {defenseCases.length === 0 && (
        <div className="text-center py-10">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No Defense Cases Found</p>
          <p className="text-muted-foreground mt-2">You currently don't have any cases where you're named as defendant.</p>
        </div>
      )}

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Find a Lawyer for Your Defense</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <RequestDefenseLawyer 
              caseId={selectedCase.id} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
