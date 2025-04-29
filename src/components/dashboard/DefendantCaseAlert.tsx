
import React from 'react';
import { useDefendantCases } from '@/hooks/useDefendantCases';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DefendantCaseAlert = () => {
  const { defendantCases, isLoading } = useDefendantCases();

  if (isLoading || defendantCases.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle>Legal Action Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          There {defendantCases.length === 1 ? 'is' : 'are'} {defendantCases.length} legal {defendantCases.length === 1 ? 'case' : 'cases'} filed against you that require immediate attention.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="destructive" size="sm" asChild>
            <Link to="/cases">View Cases</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/find-lawyer">Find a Lawyer</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
