
import React from "react";
import { useEffect, useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CaseRequest } from "@/services/types";
import { Loader2 } from "lucide-react";

export const CaseRequestStatus = () => {
  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { getClientCaseRequests, getUserById } = useFirebaseData();
  const { userData } = useFirebaseAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!userData?.id) return;
      
      try {
        setLoading(true);
        const clientRequests = await getClientCaseRequests(userData.id);
        setRequests(clientRequests);
      } catch (error) {
        console.error("Error fetching case requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userData?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Defense Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => {
            const lawyer = getUserById(request.lawyerId);
            return (
              <div key={request.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.caseTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested: {lawyer?.name || "Loading lawyer..."}
                  </p>
                </div>
                <Badge variant={request.status === "pending" ? "outline" : "default"}>
                  {request.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
