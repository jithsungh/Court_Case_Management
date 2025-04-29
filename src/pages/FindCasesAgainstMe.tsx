
import React from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import FindCasesAgainstMe from "@/components/cases/FindCasesAgainstMe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";

const FindCasesAgainstMePage = () => {
  const { userData } = useFirebaseAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find Cases Against Me</h1>
        <p className="text-muted-foreground">Search for and respond to cases filed against you</p>
      </div>

      {!userData?.id ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You need to be logged in to fully use this feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              While you can search for cases anonymously, you'll need to be logged in to claim your identity 
              as a defendant and request legal representation.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <FindCasesAgainstMe />
    </div>
  );
};

export default FindCasesAgainstMePage;
