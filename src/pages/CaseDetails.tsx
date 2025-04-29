
import { useParams, useNavigate } from "react-router-dom";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { CaseDetail } from "@/components/cases/CaseDetail";
import { JudgementForm } from "@/components/cases/JudgementForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTimestamp } from "@/utils/dateUtils";

const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, userData } = useFirebaseAuth();
  const { getCaseById, updateCase } = useFirebaseData();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!id) {
    return <div>Case ID not found</div>;
  }

  const caseItem = getCaseById(id);
  if (!caseItem) {
    return <div>Case not found</div>;
  }

  const handleJudgementSubmit = (judgement: {
    decision: 'approved' | 'denied' | 'partial';
    ruling: string;
    courtRoomNumber: string;
    judgeName: string;
  }) => {
    // Update the case with the judgement
    updateCase(id, {
      status: judgement.decision === 'denied' ? 'dismissed' : 'closed',
      judgement: {
        decision: judgement.decision,
        ruling: judgement.ruling,
        issuedAt: createTimestamp(new Date()),
        issuedBy: userData?.id || '',
        judgeName: judgement.judgeName,
        courtRoomNumber: judgement.courtRoomNumber
      }
    });

    toast({
      title: "Judgement Issued",
      description: "The case judgement has been issued successfully.",
    });

    // Redirect to the docket page
    navigate("/docket");
  };

  return (
    <div className="space-y-6">
      <CaseDetail />
      
      {userData?.role === 'judge' && caseItem.status === 'in_progress' && (
        <Tabs defaultValue="case">
          <TabsList>
            <TabsTrigger value="case">Case Details</TabsTrigger>
            <TabsTrigger value="judgement">Issue Judgement</TabsTrigger>
          </TabsList>
          <TabsContent value="case">
            {/* Case details are already shown by CaseDetail component */}
          </TabsContent>
          <TabsContent value="judgement">
            <JudgementForm 
              caseId={id} 
              onJudgementSubmit={handleJudgementSubmit} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default CaseDetails;
