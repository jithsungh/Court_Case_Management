
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Case } from "@/services/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { formatTimestamp } from "@/utils/dateUtils";
import { ProcessCaseForm } from "@/components/cases/ProcessCaseForm";

interface CaseCardsProps {
  cases: Case[];
  title?: string;
  showProcessButton?: boolean;
  actionButton?: (caseItem: Case) => React.ReactNode;
}

export function CaseCards({ cases, title = "Cases", showProcessButton = false, actionButton }: CaseCardsProps) {
  const navigate = useNavigate();
  const { userData } = useFirebaseAuth();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);

  const handleViewCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleProcessCase = (caseItem: Case, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCase(caseItem);
    setIsProcessFormOpen(true);
  };

  const closeProcessForm = () => {
    setIsProcessFormOpen(false);
    setSelectedCase(null);
  };

  if (cases.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">No cases found.</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((caseItem) => (
            <Card 
              key={caseItem.id} 
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleViewCase(caseItem.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                  <Badge variant={
                    caseItem.status === "filed" ? "default" :
                    caseItem.status === "scheduled" ? "secondary" :
                    caseItem.status === "closed" ? "outline" : 
                    "default"
                  }>
                    {caseItem.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground truncate">
                  {caseItem.description}
                </p>
                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Case #:</dt>
                    <dd>{caseItem.caseNumber || "N/A"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Filed Date:</dt>
                    <dd>{formatTimestamp(caseItem.filedDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type:</dt>
                    <dd>{caseItem.type || "N/A"}</dd>
                  </div>
                </dl>
              </CardContent>
              {showProcessButton && userData?.role === "clerk" && caseItem.status === "filed" && (
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={(e) => handleProcessCase(caseItem, e)}
                  >
                    Process Case
                  </Button>
                </CardFooter>
              )}
              {actionButton && (
                <CardFooter>
                  {actionButton(caseItem)}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      </div>

      <ProcessCaseForm 
        isOpen={isProcessFormOpen} 
        onClose={closeProcessForm} 
        selectedCase={selectedCase} 
      />
    </>
  );
}
