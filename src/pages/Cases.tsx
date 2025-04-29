
import { CaseList } from "@/components/cases/CaseList";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { FilePlus, Search } from "lucide-react";
import { DefendantCaseAlerts } from "@/components/dashboard/DefendantCaseAlerts";
import { CaseRequestStatus } from "@/components/cases/CaseRequestStatus";

const Cases = () => {
  const { userData } = useFirebaseAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {userData?.role === "client" && (
        <>
          <DefendantCaseAlerts />
          <CaseRequestStatus />
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => navigate("/defense-cases")}
          >
            View Defense Cases
          </Button>
        </>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Case Management</h1>
          <p className="text-muted-foreground">View and manage all your court cases</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/find-cases-against-me" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Find Cases Against Me
            </Link>
          </Button>
          
          {userData && userData.role === "lawyer" && (
            <Button asChild>
              <Link to="/file-case" className="flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                File New Case
              </Link>
            </Button>
          )}
        </div>
      </div>

      <CaseList />
    </div>
  );
};

export default Cases;
