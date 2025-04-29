
import React, { useState } from 'react';
import { useFirebaseData } from '@/context/FirebaseDataContext';
import { Case } from '@/services/types';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatTimestamp } from '@/utils/dateUtils';
import { ProcessCaseForm } from '@/components/cases/ProcessCaseForm';

const ClerkCaseList = () => {
  const { cases } = useFirebaseData();
  const navigate = useNavigate();
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);

  // Filter only cases that are in "filed" status 
  const filedCases = cases.filter(c => c.status === "filed");

  const handleViewCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleProcessCase = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsProcessFormOpen(true);
  };

  const closeProcessForm = () => {
    setIsProcessFormOpen(false);
    setSelectedCase(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cases Awaiting Processing</h2>
        <p className="text-muted-foreground">
          Review and process cases where both parties have legal representation
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case Number</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Plaintiff</TableHead>
            <TableHead>Defendant</TableHead>
            <TableHead>Filed Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filedCases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No cases awaiting processing
              </TableCell>
            </TableRow>
          ) : (
            filedCases.map((case_: Case) => (
              <TableRow key={case_.id}>
                <TableCell>{case_.caseNumber}</TableCell>
                <TableCell>{case_.title}</TableCell>
                <TableCell>{case_.plaintiff.name}</TableCell>
                <TableCell>{case_.defendant.name}</TableCell>
                <TableCell>
                  {case_.filedDate ? formatTimestamp(case_.filedDate) : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => handleViewCase(case_.id)}
                      size="sm"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleProcessCase(case_)}
                      size="sm"
                    >
                      Process
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <ProcessCaseForm 
        isOpen={isProcessFormOpen} 
        onClose={closeProcessForm} 
        selectedCase={selectedCase} 
      />
    </div>
  );
};

export default ClerkCaseList;
