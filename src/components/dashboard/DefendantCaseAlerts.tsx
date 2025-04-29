
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case } from "@/services/types";
import { Bell } from "lucide-react";

export const DefendantCaseAlerts = () => {
  const [defenseCases, setDefenseCases] = useState<Case[]>([]);
  const { getAllCases } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadDefenseCases = async () => {
      try {
        const allCases = await getAllCases();
        // Filter cases where current user's phone matches defendant's phone
        const userDefenseCases = allCases.filter(
          (caseItem) => caseItem.defendant?.phoneNumber === userData?.phoneNumber
        );
        setDefenseCases(userDefenseCases);
      } catch (error) {
        console.error("Error loading defense cases:", error);
      }
    };

    if (userData?.phoneNumber) {
      loadDefenseCases();
    }
  }, [userData]);

  if (defenseCases.length === 0) {
    return null;
  }

  return (
    <Alert className="bg-amber-50 border-amber-200">
      <Bell className="h-5 w-5 text-amber-500" />
      <AlertTitle className="text-amber-700">Defense Cases Found</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col gap-4">
        <p>
          There {defenseCases.length === 1 ? 'is' : 'are'} {defenseCases.length} case{defenseCases.length !== 1 ? 's' : ''} where 
          you are named as a defendant. Review these cases and take appropriate action.
        </p>
        <Button
          variant="outline"
          className="self-start border-amber-500 text-amber-700 hover:bg-amber-100"
          onClick={() => navigate("/defense-cases")}
        >
          View Defense Cases
        </Button>
      </AlertDescription>
    </Alert>
  );
};
