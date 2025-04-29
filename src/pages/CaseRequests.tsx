
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { CaseRequest, User, CaseStatus } from "@/services/types";
import { Timestamp } from "firebase/firestore";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, UserPlus } from "lucide-react";

const CaseRequests = () => {
  const { userData } = useFirebaseAuth();
  const { toast } = useToast();
  const { users, cases } = useFirebaseData();
  const [selectedRequest, setSelectedRequest] = useState<CaseRequest | null>(
    null
  );

  const { acceptCaseRequest, rejectCaseRequest, updateCase } =
    useFirebaseData();
  const [lawyerCaseRequests, setLawyerCaseRequests] = useState<CaseRequest[]>(
    []
  );
  const lawyerId = userData?.id;
  const { getLawyerCaseRequests } = useFirebaseData();

  useEffect(() => {
    const fetchCaseRequests = async () => {
      console.log("CaseRequests: fetchCaseRequests called");
      if (lawyerId) {
        console.log("CaseRequests: fetchCaseRequests lawyerId:", lawyerId);
        const requests = await getLawyerCaseRequests(lawyerId);
        setLawyerCaseRequests(requests);
      }
    };

    fetchCaseRequests();
  }, [lawyerId, getLawyerCaseRequests]);

  // Helper to get client data by ID
  const getClientById = (clientId: string): User | undefined => {
    return users.find((u) => u.id === clientId);
  };

  // Get case info for defense requests
  const getCaseInfo = (caseId: string) => {
    return cases.find((c) => c.id === caseId);
  };

  // Handle accepting a case request
  const handleAccept = async (requestId: string) => {
    try {
      const request = lawyerCaseRequests.find((r) => r.id === requestId);
      if (!request) return;

      await acceptCaseRequest(requestId);

      // Update case status if this is a defense request
      if (request.type === "defense" && request.caseId) {
        await updateCase(request.caseId, {
          status: "filed" as CaseStatus,
          defendantLawyerId: userData?.id,
          updatedAt: Timestamp.now(),
        });
      }

      toast({
        title: "Case Request Accepted",
        description:
          request.type === "defense"
            ? "You are now the defense lawyer for this case. The case status has been updated to 'filed'."
            : "You have accepted the case request.",
      });
      
      // Refresh the case requests list
      const updatedRequests = await getLawyerCaseRequests(lawyerId || "");
      setLawyerCaseRequests(updatedRequests);
      
    } catch (error) {
      console.error("Error accepting case request:", error);
      toast({
        title: "Error accepting case request",
        description:
          "There was a problem accepting the case request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a case request
  const handleReject = async (requestId: string) => {
    try {
      await rejectCaseRequest(requestId);
      toast({
        title: "Case Request Rejected",
        description: "You have rejected the case request.",
      });
      
      // Refresh the case requests list
      const updatedRequests = await getLawyerCaseRequests(lawyerId || "");
      setLawyerCaseRequests(updatedRequests);
      
    } catch (error) {
      console.error("Error rejecting case request:", error);
      toast({
        title: "Error rejecting case request",
        description:
          "There was a problem rejecting the case request. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter requests by status and type
  const newCaseRequests = lawyerCaseRequests.filter(
    (req) => req.status === "pending" && req.type !== "defense"
  );
  
  const defenseRequests = lawyerCaseRequests.filter(
    (req) => req.type === "defense" && req.status === "pending"
  );
  
  const acceptedRequests = lawyerCaseRequests.filter(
    (req) => req.status === "accepted"
  );
  
  const rejectedRequests = lawyerCaseRequests.filter(
    (req) => req.status === "rejected"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Case Requests</h1>
        <p className="text-muted-foreground">
          Manage incoming client requests for legal representation
        </p>
      </div>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">
            New Cases
            {newCaseRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {newCaseRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="defense">
            Defense Requests
            {defenseRequests.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {defenseRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="mt-6">
          {newCaseRequests.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {newCaseRequests.map((request) => {
                const client = getClientById(request.clientId);

                return (
                  <Card
                    key={request.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>{request.caseTitle}</CardTitle>
                        <Badge>New Case</Badge>
                      </div>
                      <CardDescription>
                        Requested on{" "}
                        {new Date(
                          request.createdAt.toDate()
                        ).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={client?.avatarUrl}
                            alt={client?.name}
                          />
                          <AvatarFallback>
                            {client?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3">
                        {request.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>{request.caseTitle}</DialogTitle>
                            <DialogDescription>
                              Case request from {client?.name} on{" "}
                              {new Date(
                                request.createdAt.toDate()
                              ).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <ScrollArea className="h-[200px] rounded-md border p-4">
                              <p>{request.description}</p>
                            </ScrollArea>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage
                                  src={client?.avatarUrl}
                                  alt={client?.name}
                                />
                                <AvatarFallback>
                                  {client?.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{client?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {client?.email}
                                </p>
                                {client?.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    {client.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </Button>
                            <Button onClick={() => handleAccept(request.id)}>
                              Accept Case
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(request.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-10">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No new case requests</h3>
              <p className="text-muted-foreground">
                You don't have any pending requests for new cases at the moment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="defense" className="mt-6">
          {defenseRequests.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {defenseRequests.map((request) => {
                const client = getClientById(request.clientId);
                const caseInfo = request.caseId ? getCaseInfo(request.caseId) : null;

                return (
                  <Card
                    key={request.id}
                    className="overflow-hidden hover:shadow-md transition-shadow border-red-200"
                  >
                    <CardHeader className="pb-3 bg-red-50">
                      <div className="flex justify-between items-start">
                        <CardTitle>
                          {caseInfo?.title || request.caseTitle}
                        </CardTitle>
                        <Badge variant="defense">Defense</Badge>
                      </div>
                      <CardDescription>
                        Requested on{" "}
                        {new Date(
                          request.createdAt.toDate()
                        ).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={client?.avatarUrl}
                            alt={client?.name}
                          />
                          <AvatarFallback>
                            {client?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </div>
                      
                      {caseInfo && (
                        <div className="border p-2 rounded-md bg-gray-50 text-sm">
                          <p><strong>Case #:</strong> {caseInfo.caseNumber}</p>
                          <p><strong>Status:</strong> {caseInfo.status}</p>
                          <p><strong>Plaintiff:</strong> {caseInfo.plaintiff?.name}</p>
                        </div>
                      )}
                      
                      <p className="text-sm line-clamp-3">
                        {request.description}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              {caseInfo?.title || request.caseTitle}
                            </DialogTitle>
                            <DialogDescription>
                              Defense request from {client?.name} on{" "}
                              {new Date(
                                request.createdAt.toDate()
                              ).toLocaleDateString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {caseInfo && (
                              <div className="border p-3 rounded-md bg-gray-50">
                                <h4 className="font-medium mb-2">Case Details</h4>
                                <p><strong>Case #:</strong> {caseInfo.caseNumber}</p>
                                <p><strong>Status:</strong> {caseInfo.status}</p>
                                <p><strong>Plaintiff:</strong> {caseInfo.plaintiff?.name}</p>
                                <p><strong>Filed Date:</strong> {caseInfo.filedDate ? 
                                  new Date(caseInfo.filedDate.seconds * 1000).toLocaleDateString() : 
                                  "Not filed"}</p>
                              </div>
                            )}
                            
                            <ScrollArea className="h-[200px] rounded-md border p-4">
                              <p>{request.description}</p>
                            </ScrollArea>
                            
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage
                                  src={client?.avatarUrl}
                                  alt={client?.name}
                                />
                                <AvatarFallback>
                                  {client?.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{client?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {client?.email}
                                </p>
                                {client?.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    {client.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => handleReject(request.id)}
                            >
                              Reject
                            </Button>
                            <Button 
                              variant="default"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleAccept(request.id)}
                            >
                              Accept Defense Case
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => handleAccept(request.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-10">
              <Users className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No defense requests</h3>
              <p className="text-muted-foreground">
                You don't have any pending requests for defense representation
                at the moment.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {acceptedRequests.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {acceptedRequests.map((request) => {
                const client = getClientById(request.clientId);

                return (
                  <Card
                    key={request.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>{request.caseTitle}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Accepted
                        </Badge>
                      </div>
                      <CardDescription>
                        Requested on
                        {new Date(
                          request.createdAt.toDate()
                        ).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={client?.avatarUrl}
                            alt={client?.name}
                          />
                          <AvatarFallback>
                            {client?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3">
                        {request.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button asChild className="w-full">
                        <a href="/cases">View in Active Cases</a>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-10">
              <UserPlus className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No accepted requests</h3>
              <p className="text-muted-foreground">
                You haven't accepted any case requests yet.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {rejectedRequests.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {rejectedRequests.map((request) => {
                const client = getClientById(request.clientId);

                return (
                  <Card
                    key={request.id}
                    className="overflow-hidden hover:shadow-md transition-shadow opacity-70"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle>{request.caseTitle}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Rejected
                        </Badge>
                      </div>
                      <CardDescription>
                        Requested on
                        {new Date(
                          request.createdAt.toDate()
                        ).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage
                            src={client?.avatarUrl}
                            alt={client?.name}
                          />
                          <AvatarFallback>
                            {client?.name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm line-clamp-3">
                        {request.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-10">
              <h3 className="text-lg font-medium">No rejected requests</h3>
              <p className="text-muted-foreground">
                You haven't rejected any case requests.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseRequests;
