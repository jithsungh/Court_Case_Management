
import { useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, FileText, Gavel, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";
import { ReschedulingRecord } from "@/services/types";

const CaseStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500">Active</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-500">Scheduled</Badge>;
    case 'in_progress':
      return <Badge className="bg-yellow-500">In Progress</Badge>;
    case 'on_hold':
      return <Badge className="bg-orange-500">On Hold</Badge>;
    case 'dismissed':
      return <Badge className="bg-red-500">Dismissed</Badge>;
    case 'closed':
      return <Badge className="bg-gray-500">Closed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const RescheduleHearingDialog = ({ 
  hearingId, 
  currentDate, 
  currentTime, 
  onReschedule 
}: { 
  hearingId: string, 
  currentDate: string, 
  currentTime: string, 
  onReschedule: (hearingId: string, date: string, time: string, reason: string) => void 
}) => {
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  
  const handleReschedule = () => {
    onReschedule(hearingId, date, time, reason);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Reschedule</Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Hearing</DialogTitle>
          <DialogDescription>
            Change the date and time for this hearing and provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Time
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
            </Label>
            <Textarea
              id="reason"
              placeholder="Reason for rescheduling"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleReschedule} disabled={!date || !time || !reason}>
            Reschedule Hearing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Docket = () => {
  const { userData } = useFirebaseAuth();
  const { cases, hearings, updateHearing, addReschedulingHistory } = useFirebaseData();
  const { toast } = useToast();
  
  // Group cases by status
  const activeCases = cases.filter(c => ['active', 'in_progress'].includes(c.status));
  const scheduledCases = cases.filter(c => c.status === 'scheduled');
  const closedCases = cases.filter(c => ['dismissed', 'closed'].includes(c.status));
  
  // Get today's hearings
  const today = new Date();
  const todaysHearings = hearings.filter(h => {
    if (!h.date) return false;
    
    try {
      const hearingDate = h.date.toDate();
      return (
        hearingDate.getDate() === today.getDate() &&
        hearingDate.getMonth() === today.getMonth() &&
        hearingDate.getFullYear() === today.getFullYear()
      );
    } catch (error) {
      return false;
    }
  });

  const formatHearingTime = (hearing: any) => {
    if (!hearing.date) return "No time set";
    
    try {
      const hearingDate = hearing.date.toDate();
      return hearingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return hearing.time || "No time set";
    }
  };
  
  const formatHearingDate = (hearing: any) => {
    if (!hearing.date) return "No date set";
    
    try {
      const hearingDate = hearing.date.toDate();
      return hearingDate.toLocaleDateString();
    } catch (error) {
      return hearing.date || "No date set";
    }
  };

  const handleRescheduleHearing = (hearingId: string, date: string, time: string, reason: string) => {
    // Create date from string inputs
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const newDate = new Date(year, month - 1, day, hours, minutes);
    const newDateTimestamp = Timestamp.fromDate(newDate);
    
    // Get the current hearing to access its current date
    const hearing = hearings.find(h => h.id === hearingId);
    if (!hearing || !hearing.date || !userData?.id) {
      toast({
        title: "Error",
        description: "Failed to reschedule hearing. Missing required information.",
        variant: "destructive"
      });
      return;
    }
    
    // Update the hearing
    updateHearing(hearingId, {
      date: newDateTimestamp,
      status: 'scheduled',
      rescheduled: true
    });
    
    // Add to rescheduling history
    const previousDateTimestamp = hearing.date;
    
    addReschedulingHistory(hearingId, {
      previousDate: previousDateTimestamp,
      newDate: newDateTimestamp,
      reason,
      judgeId: userData.id,
    } as Omit<ReschedulingRecord, "rescheduledAt">);
    
    toast({
      title: "Hearing Rescheduled",
      description: `Hearing has been rescheduled to ${date} at ${time}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Docket</h1>
        <p className="text-muted-foreground">Manage your court schedule and case assignments</p>
      </div>

      {todaysHearings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Hearings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaysHearings.map(hearing => {
                const relatedCase = cases.find(c => c.id === hearing.caseId);
                
                return (
                  <div key={hearing.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                    <div className="flex flex-col">
                      <div className="font-medium">{relatedCase?.title || `Case #${hearing.caseId}`}</div>
                      <div className="text-sm text-muted-foreground">{hearing.description}</div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-xs">{formatHearingTime(hearing)}</span>
                        <MapPin className="h-3 w-3 mx-1 text-muted-foreground" />
                        <span className="text-xs">{hearing.location}</span>
                      </div>
                      {hearing.rescheduled && (
                        <div className="flex items-center mt-1">
                          <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                          <span className="text-xs text-amber-500">Rescheduled</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {userData?.role === 'judge' && (
                        <RescheduleHearingDialog 
                          hearingId={hearing.id} 
                          currentDate={formatHearingDate(hearing)} 
                          currentTime={formatHearingTime(hearing)} 
                          onReschedule={handleRescheduleHearing} 
                        />
                      )}
                      <Button size="sm" asChild>
                        <Link to={`/cases/${hearing.caseId}`}>View Case</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="active">Active Cases ({activeCases.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledCases.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedCases.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {activeCases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No active cases</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeCases.map(caseItem => (
                <Card key={caseItem.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                      <CaseStatusBadge status={caseItem.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {caseItem.caseNumber}
                    </p>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm mb-4">{caseItem.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Filed: {
                          caseItem.filedDate 
                            ? formatDistanceToNow(caseItem.filedDate.toDate(), { addSuffix: true }) 
                            : 'Unknown'
                        }</span>
                      </div>
                      <div className="flex items-center">
                        <Gavel className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{caseItem.judge?.judgeName || 'Not assigned'}</span>
                      </div>
                      {caseItem.nextHearingDate && (
                        <div className="flex items-center col-span-2">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Next hearing: {
                            formatDistanceToNow(caseItem.nextHearingDate.toDate(), { addSuffix: true })
                          }</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button size="sm" asChild>
                        <Link to={`/cases/${caseItem.id}`}>Case Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-4">
          {scheduledCases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No scheduled cases</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {scheduledCases.map(caseItem => (
                <Card key={caseItem.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{caseItem.title}</CardTitle>
                      <CaseStatusBadge status={caseItem.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{caseItem.description}</p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link to={`/cases/${caseItem.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="closed" className="mt-4">
          {closedCases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No closed cases</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {closedCases.map(caseItem => (
                <Card key={caseItem.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{caseItem.title}</CardTitle>
                      <CaseStatusBadge status={caseItem.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{caseItem.description}</p>
                    <Button size="sm" className="mt-4" asChild>
                      <Link to={`/cases/${caseItem.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Docket;
