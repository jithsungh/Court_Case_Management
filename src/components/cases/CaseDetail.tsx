
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Calendar, FileText, User, Users, FileBarChart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Evidence, Hearing, Message } from "@/services/types";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatTimestamp } from "@/utils/dateUtils";

export const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { userData } = useFirebaseAuth();
  const { getCaseById, getUserById, getMessagesByCaseId, getHearingsByCaseId, getEvidenceByCaseId } = useFirebaseData();

  const [caseDetails, setCaseDetails] = useState(id ? getCaseById(id) : null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCaseData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const [messagesData, hearingsData, evidenceData] = await Promise.all([
          getMessagesByCaseId(id),
          getHearingsByCaseId(id),
          getEvidenceByCaseId(id)
        ]);

        setMessages(messagesData);
        setHearings(hearingsData);
        setEvidence(evidenceData);
      } catch (err) {
        console.error("Error loading case data:", err);
        setError("Failed to load case data");
      } finally {
        setLoading(false);
      }
    };

    loadCaseData();
  }, [id]);

  if (!caseDetails || !userData) {
    return <div>Case not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{caseDetails.title}</h1>
        <Badge>{caseDetails.status}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="hearings">Hearings</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
              <CardDescription>Case #{caseDetails.caseNumber || id?.substring(0, 8)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{caseDetails.description}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Parties</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Plaintiff</p>
                        <p className="text-sm text-muted-foreground">{getUserById(caseDetails.clientId)?.name || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    {caseDetails.defendant && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Defendant</p>
                          <p className="text-sm text-muted-foreground">{caseDetails.defendant.name || 'Unknown'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Communication history</CardDescription>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className="flex gap-4">
                        <Avatar>
                          <AvatarFallback>{getUserById(message.senderId)?.name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex gap-2 items-center">
                            <p className="text-sm font-medium">{getUserById(message.senderId)?.name}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatTimestamp(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-muted-foreground">No messages yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hearings">
          <Card>
            <CardHeader>
              <CardTitle>Hearings</CardTitle>
              <CardDescription>Scheduled court appearances</CardDescription>
            </CardHeader>
            <CardContent>
              {hearings.length > 0 ? (
                <div className="space-y-4">
                  {hearings.map((hearing) => (
                    <div key={hearing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Court Hearing</p>
                        <p className="text-sm text-muted-foreground">{formatTimestamp(hearing.date)}</p>
                      </div>
                      <Badge>{hearing.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No hearings scheduled</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
              <CardDescription>Case documents and exhibits</CardDescription>
            </CardHeader>
            <CardContent>
              {evidence.length > 0 ? (
                <div className="space-y-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">Uploaded by {getUserById(item.uploadedBy)?.name}</p>
                        </div>
                      </div>
                      <Button variant="ghost">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No evidence uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
