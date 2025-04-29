
import React, { useState, useEffect } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimestamp } from "@/utils/dateUtils";
import { CaseRequest } from "@/services/types";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const DefenseRequests = () => {
  const { getLawyerCaseRequests, getUserById, getCaseById, acceptCaseRequest, rejectCaseRequest } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<CaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (userData?.id && userData.role === "lawyer") {
        setLoading(true);
        try {
          const allRequests = await getLawyerCaseRequests(userData.id);
          // Filter for defense requests only
          const defenseRequests = allRequests.filter(req => req.type === "defense");
          setRequests(defenseRequests);
        } catch (error) {
          console.error("Error fetching defense requests:", error);
          toast({
            title: "Error",
            description: "Failed to load defense requests. Please try again.",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRequests();
  }, [userData?.id, userData?.role, getLawyerCaseRequests, toast]);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await acceptCaseRequest(requestId);
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: "accepted" } : req
        )
      );
      toast({
        title: "Request Accepted",
        description: "You are now representing the client in this case.",
      });
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Error",
        description: "Failed to accept the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await rejectCaseRequest(requestId);
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: "rejected" } : req
        )
      );
      toast({
        title: "Request Rejected",
        description: "You have declined to represent the client in this case.",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingRequests = requests.filter(req => req.status === "pending");
  const acceptedRequests = requests.filter(req => req.status === "accepted");
  const rejectedRequests = requests.filter(req => req.status === "rejected");

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading defense requests...</p>
      </div>
    );
  }

  if (!userData || userData.role !== "lawyer") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Defense Requests</h1>
          <p className="text-muted-foreground">View and manage requests from defendants seeking representation</p>
        </div>
        
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">Access Restricted</h2>
              <p className="mt-2">Only lawyers can access defense requests.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Defense Requests</h1>
        <p className="text-muted-foreground">View and manage requests from defendants seeking representation</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No Pending Requests</h2>
                  <p className="mt-2">You don't have any pending defense requests.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => {
                const client = getUserById(request.clientId);
                const caseData = request.caseId ? getCaseById(request.caseId) : null;
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {client?.name || "Client"} is seeking representation
                      </CardTitle>
                      <CardDescription>
                        Defense request for case: {caseData?.title || request.caseTitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Case Details</h3>
                          <p className="mt-1">{caseData?.description || request.description}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Defense Notes</h3>
                          <p className="mt-1">{request.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium">Request Date</h3>
                            <p className="mt-1">{formatTimestamp(request.createdAt)}</p>
                          </div>
                          {caseData && caseData.caseNumber && (
                            <div>
                              <h3 className="text-sm font-medium">Case Number</h3>
                              <p className="mt-1">{caseData.caseNumber}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      {request.caseId && (
                        <Button variant="outline" asChild>
                          <Link to={`/cases/${request.caseId}`}>
                            View Case
                          </Link>
                        </Button>
                      )}
                      <div className="flex space-x-2">
                        <Button 
                          variant="destructive" 
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                        <Button 
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-4">
          {acceptedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No Accepted Requests</h2>
                  <p className="mt-2">You haven't accepted any defense requests yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {acceptedRequests.map(request => {
                const client = getUserById(request.clientId);
                const caseData = request.caseId ? getCaseById(request.caseId) : null;
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {client?.name || "Client"}
                          </CardTitle>
                          <CardDescription>
                            Case: {caseData?.title || request.caseTitle}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Accepted
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Defense Notes</h3>
                          <p className="mt-1">{request.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium">Request Date</h3>
                            <p className="mt-1">{formatTimestamp(request.createdAt)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Accepted Date</h3>
                            <p className="mt-1">{formatTimestamp(request.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {request.caseId && (
                        <Button asChild className="w-full">
                          <Link to={`/cases/${request.caseId}`}>
                            Manage Case
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No Rejected Requests</h2>
                  <p className="mt-2">You haven't rejected any defense requests.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedRequests.map(request => {
                const client = getUserById(request.clientId);
                const caseData = request.caseId ? getCaseById(request.caseId) : null;
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {client?.name || "Client"}
                          </CardTitle>
                          <CardDescription>
                            Case: {caseData?.title || request.caseTitle}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                          Rejected
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Defense Notes</h3>
                          <p className="mt-1">{request.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium">Request Date</h3>
                            <p className="mt-1">{formatTimestamp(request.createdAt)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Rejected Date</h3>
                            <p className="mt-1">{formatTimestamp(request.updatedAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DefenseRequests;
