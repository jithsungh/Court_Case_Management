
import { useEffect, useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { Case, Hearing } from "@/services/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, FileText, Gavel, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp, timestampToDate } from "@/utils/dateUtils";
import { Timestamp } from "firebase/firestore";

const HearingsPage = () => {
  const { toast } = useToast();
  const [sortedHearings, setSortedHearings] = useState<Hearing[]>([]);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isPostponeDialogOpen, setIsPostponeDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [hearingNotes, setHearingNotes] = useState("");
  const [postponeDate, setPostponeDate] = useState<Date | undefined>(undefined);
  const [postponeTime, setPostponeTime] = useState("09:00");
  const [postponeReason, setPostponeReason] = useState("");
  const [caseOutcome, setCaseOutcome] = useState("");
  
  const { userData } = useFirebaseAuth();
  const { hearings, cases, updateHearing, updateCase, addReschedulingHistory } = useFirebaseData();

  const isJudge = userData?.role === "judge";

  useEffect(() => {
    // Filter hearings relevant to the current user
    let userRelevantHearings = hearings;
    
    if (userData?.role === "lawyer" || userData?.role === "client") {
      // For lawyers and clients, show only hearings related to their cases
      const userCases = cases.filter(c => 
        (userData.role === "lawyer" && 
          (c.plaintifflawyer?.barId === userData.barId || c.defendantlawyer?.barId === userData.barId)) ||
        (userData.role === "client" && 
          (c.plaintiff?.governmentIdNumber === userData.idNumber || c.defendant?.governmentIdNumber === userData.idNumber))
      );
      
      const userCaseIds = userCases.map(c => c.id);
      userRelevantHearings = hearings.filter(h => userCaseIds.includes(h.caseId));
    }
    
    // Sort hearings by date and time
    const sorted = [...userRelevantHearings].sort((a, b) => {
      const dateA = a.date?.toDate().getTime() || 0;
      const dateB = b.date?.toDate().getTime() || 0;
      return dateA - dateB;
    });
    
    setSortedHearings(sorted);
  }, [hearings, cases, userData]);

  const handleAddHearingNotes = async () => {
    if (!selectedHearing || !hearingNotes.trim()) return;

    try {
      await updateHearing(selectedHearing.id, {
        notes: hearingNotes
      });

      toast({
        title: "Notes saved",
        description: "Hearing notes have been saved successfully"
      });

      setIsNotesDialogOpen(false);
      setHearingNotes("");
    } catch (error) {
      console.error("Error saving hearing notes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save hearing notes"
      });
    }
  };

  const handlePostponeHearing = async () => {
    if (!selectedHearing || !postponeDate || !postponeReason.trim() || !userData) return;

    try {
      // Format the new hearing date and time
      const newHearingDate = new Date(postponeDate);
      const [hours, minutes] = postponeTime.split(":");
      newHearingDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      // Create rescheduling record
      await addReschedulingHistory(selectedHearing.id, {
        previousDate: selectedHearing.date,
        newDate: Timestamp.fromDate(newHearingDate),
        reason: postponeReason,
        judgeId: userData.id
      });

      // Update case with new next hearing date
      const relatedCase = cases.find(c => c.id === selectedHearing.caseId);
      if (relatedCase) {
        await updateCase(relatedCase.id, {
          nextHearingDate: Timestamp.fromDate(newHearingDate)
        });
      }

      toast({
        title: "Hearing postponed",
        description: "The hearing has been rescheduled successfully"
      });

      setIsPostponeDialogOpen(false);
      setPostponeDate(undefined);
      setPostponeTime("09:00");
      setPostponeReason("");
    } catch (error) {
      console.error("Error postponing hearing:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to postpone hearing"
      });
    }
  };

  const handleCloseCase = async () => {
    if (!selectedHearing || !caseOutcome.trim()) return;

    try {
      const relatedCase = cases.find(c => c.id === selectedHearing.caseId);
      if (relatedCase) {
        await updateCase(relatedCase.id, {
          status: "closed",
          description: `${relatedCase.description}\n\n--- CASE CLOSED ---\n${caseOutcome}`
        });

        // Update the hearing status
        await updateHearing(selectedHearing.id, {
          status: "completed",
          notes: (selectedHearing.notes || "") + `\n\nCase closed with outcome: ${caseOutcome}`
        });

        toast({
          title: "Case closed",
          description: "The case has been closed successfully"
        });
      }

      setIsCloseDialogOpen(false);
      setCaseOutcome("");
    } catch (error) {
      console.error("Error closing case:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to close case"
      });
    }
  };

  const getCaseDetails = (hearing: Hearing): Case | undefined => {
    return cases.find(c => c.id === hearing.caseId);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Hearings</h1>
      
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedHearings.length > 0 ? (
            sortedHearings.map((hearing) => {
              const caseData = getCaseDetails(hearing);
              const isPastHearing = hearing.date ? new Date(hearing.date.toDate()) < new Date() : false;
              
              return (
                <Card key={hearing.id} className={cn(
                  "transition-shadow hover:shadow-md",
                  isPastHearing ? "border-muted" : "border-primary/20"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {caseData?.title || "Hearing"}
                      </CardTitle>
                      <Badge variant={
                        hearing.status === "scheduled" ? "default" :
                        hearing.status === "completed" ? "outline" :
                        "secondary"
                      }>
                        {hearing.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Case #{caseData?.caseNumber || "N/A"}
                    </p>
                  </CardHeader>
                  
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {formatTimestamp(hearing.date, "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>
                        {hearing.date ? formatTimestamp(hearing.date, "h:mm a") : "No time set"}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{hearing.location || "No location set"}</span>
                    </div>
                    
                    {hearing.description && (
                      <div className="mt-2 text-sm">
                        <p className="text-muted-foreground">Description:</p>
                        <p>{hearing.description}</p>
                      </div>
                    )}
                    
                    {hearing.notes && (
                      <div className="mt-2 text-sm">
                        <p className="text-muted-foreground">Notes:</p>
                        <p className="whitespace-pre-wrap">{hearing.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  {isJudge && hearing.status === "scheduled" && (
                    <CardFooter className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedHearing(hearing);
                          setHearingNotes(hearing.notes || "");
                          setIsNotesDialogOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Add Notes
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedHearing(hearing);
                          setIsPostponeDialogOpen(true);
                        }}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Postpone
                      </Button>
                      
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedHearing(hearing);
                          setIsCloseDialogOpen(true);
                        }}
                      >
                        <Gavel className="h-4 w-4 mr-2" />
                        Close Case
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center p-8">
              <p className="text-muted-foreground">No hearings found</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Notes Dialog */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Hearing Notes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter notes about the hearing proceedings..."
              className="min-h-[200px]"
              value={hearingNotes}
              onChange={(e) => setHearingNotes(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddHearingNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Postpone Dialog */}
      <Dialog open={isPostponeDialogOpen} onOpenChange={setIsPostponeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Postpone Hearing</DialogTitle>
            <DialogDescription>
              Reschedule this hearing to a different date and time
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Hearing Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !postponeDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {postponeDate ? format(postponeDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={postponeDate}
                    onSelect={setPostponeDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>New Hearing Time</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 opacity-70" />
                <Input 
                  type="time" 
                  value={postponeTime} 
                  onChange={(e) => setPostponeTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reason for Postponement</Label>
              <Textarea
                placeholder="Enter reason for postponing this hearing..."
                value={postponeReason}
                onChange={(e) => setPostponeReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsPostponeDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handlePostponeHearing}>
              Reschedule Hearing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Close Case Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Close Case</DialogTitle>
            <DialogDescription>
              Provide the final outcome for this case
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Case Outcome</Label>
              <Textarea
                placeholder="Enter the final outcome, verdict, or resolution of this case..."
                className="min-h-[150px]"
                value={caseOutcome}
                onChange={(e) => setCaseOutcome(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCloseCase}>
              Close Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HearingsPage;
