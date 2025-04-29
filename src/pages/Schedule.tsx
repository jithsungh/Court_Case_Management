
import { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { FlexibleCalendar } from "@/components/schedule/FlexibleCalendar";
import { format, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, AlertCircle, Clock, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  formatTimestamp, 
  timestampToDate,
  isHearingToday,
  isHearingTomorrow,
  isHearingThisWeek,
  groupHearingsByTime,
  sortHearingsByDate
} from "@/utils/dateUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Case, Hearing, User } from "@/services/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const Schedule = () => {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month" | "custom">("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { hearings = [], cases = [], users = [], getAllCases, getAllHearings } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Refresh hearings data
        await getAllHearings();
        // Refresh cases data
        await getAllCases();
      } catch (error) {
        console.error("Error loading schedule data:", error);
      }
    };
    
    loadData();
  }, [getAllCases, getAllHearings]);
  
  // Format the selected date to display
  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  // Filter hearings relevant to the current user based on their role
  const getUserRelevantHearings = () => {
    if (!userData) return [];
    
    console.log("Current user data:", userData);
    console.log("Total hearings available:", hearings.length);
    console.log("Total cases available:", cases.length);

    let userHearings: Hearing[] = [];

    switch (userData.role) {
      case "judge":
        // For judges, show hearings where they are assigned
        userHearings = hearings.filter(hearing => {
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          return relatedCase?.judge?.judgeId === userData.id;
        });
        break;
      
      case "clerk":
        // For clerks, show all hearings - they need to see everything
        userHearings = hearings;
        break;
      
      case "lawyer":
        // For lawyers, show hearings where they represent either party
        userHearings = hearings.filter(hearing => {
          if (!hearing.caseId) return false;
          
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          if (!relatedCase) return false;
          
          return (
            // Check if lawyer is plaintiff's lawyer
            (relatedCase.plaintifflawyer?.barId === userData.id) || 
            // Check if lawyer is defendant's lawyer
            (relatedCase.defendantlawyer?.barId === userData.id) || 
            // Check if lawyer is the primary lawyer for the case
            relatedCase.lawyerId === userData.id ||
            // Check if lawyer is the defendant's lawyer by ID
            relatedCase.defendantLawyerId === userData.id
          );
        });
        break;
      
      case "client":
        // For clients, show hearings where they are plaintiff or defendant
        userHearings = hearings.filter(hearing => {
          if (!hearing.caseId) return false;
          
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          if (!relatedCase) return false;
          
          return (
            // Check if client is the plaintiff
            relatedCase.clientId === userData.id || 
            // Check if client is the defendant
            relatedCase.defendantClientId === userData.id
          );
        });
        break;
      
      default:
        userHearings = [];
    }

    console.log("User relevant hearings before filters:", userHearings.length);

    // Apply status filter
    if (filterStatus !== "all") {
      userHearings = userHearings.filter(h => h.status === filterStatus);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      userHearings = userHearings.filter(h => {
        const caseDetail = getCaseDetails(h.caseId);
        return (
          (h.description?.toLowerCase() || "").includes(query) ||
          (h.location?.toLowerCase() || "").includes(query) ||
          (caseDetail?.title?.toLowerCase() || "").includes(query) ||
          (caseDetail?.caseNumber?.toLowerCase() || "").includes(query)
        );
      });
    }

    console.log("Final filtered hearings:", userHearings.length);
    return userHearings;
  };

  const userRelevantHearings = getUserRelevantHearings();

  // Get dates that have hearings for highlighting in calendar
  const datesWithHearings = userRelevantHearings.reduce((dates, hearing) => {
    if (!hearing || !hearing.date) return dates;
    
    try {
      const hearingDate = timestampToDate(hearing.date);
      if (!hearingDate) return dates;
      
      const dateString = format(hearingDate, "yyyy-MM-dd"); // YYYY-MM-DD format
      
      if (!dates.includes(dateString)) {
        dates.push(dateString);
      }
    } catch (error) {
      console.error("Error processing hearing date:", error);
    }
    
    return dates;
  }, [] as string[]);

  // Get hearings for the selected date
  const todaysHearings = userRelevantHearings.filter(hearing => {
    if (!hearing || !hearing.date) return false;
    
    try {
      const hearingDate = timestampToDate(hearing.date);
      return hearingDate && isSameDay(hearingDate, selectedDate);
    } catch (error) {
      console.error("Error comparing hearing date:", error);
      return false;
    }
  });

  const sortedHearings = sortHearingsByDate(todaysHearings);
  const hasHearings = sortedHearings.length > 0;
  
  // Get case details for a hearing
  const getCaseDetails = (caseId: string): Case | undefined => {
    return cases.find(c => c.id === caseId);
  };

  // Get user details
  const getUserDetails = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  // Group hearings by time proximity for easy filtering
  const { today, tomorrow, thisWeek, future, past } = groupHearingsByTime(userRelevantHearings);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Manage your hearings and upcoming appointments</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <Card className="flex items-center p-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="text-sm">{formattedDate}</span>
          </Card>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-[400px]">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Hearing Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="status-filter" className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="search-hearings">Search</Label>
                <Input
                  id="search-hearings"
                  placeholder="Search hearings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="pt-2 space-y-2">
                <h3 className="text-sm font-semibold">Quick Filters</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    className="cursor-pointer" 
                    variant={selectedDate.toDateString() === new Date().toDateString() ? "default" : "outline"}
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today ({today.length})
                  </Badge>
                  <Badge 
                    className="cursor-pointer" 
                    variant="outline"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setSelectedDate(tomorrow);
                    }}
                  >
                    Tomorrow ({tomorrow.length})
                  </Badge>
                  <Badge 
                    className="cursor-pointer" 
                    variant="outline"
                  >
                    This Week ({thisWeek.length})
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-2">
                <FlexibleCalendar 
                  viewMode="month" 
                  selectedDate={selectedDate} 
                  onDateSelect={setSelectedDate}
                  highlightedDates={datesWithHearings}
                  className="max-w-full"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Hearing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Today:</span>
                  <span className="font-medium">{today.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tomorrow:</span>
                  <span className="font-medium">{tomorrow.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Week:</span>
                  <span className="font-medium">{thisWeek.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Future:</span>
                  <span className="font-medium">{future.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Past:</span>
                  <span className="font-medium">{past.length}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total:</span>
                  <span>{userRelevantHearings.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          {/* No hearings message */}
          {!hasHearings && (
            <Alert variant="default" className="bg-muted/50">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                No hearings or appointments scheduled for {formattedDate}.
              </AlertDescription>
            </Alert>
          )}

          {/* Show hearings for the selected date */}
          {hasHearings && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Hearings on {formattedDate}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="grid grid-cols-1 gap-4">
                      {sortedHearings.map((hearing) => {
                        const caseData = getCaseDetails(hearing.caseId);
                        const judgeUser = caseData?.judge?.judgeId ? getUserDetails(caseData.judge.judgeId) : undefined;
                        
                        return (
                          <Card key={hearing.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">
                                  {caseData?.title || "Hearing"}
                                </CardTitle>
                                <Badge variant={
                                  hearing.status === "scheduled" ? "default" :
                                  hearing.status === "completed" ? "outline" :
                                  hearing.status === "canceled" ? "destructive" :
                                  "secondary"
                                }>
                                  {hearing.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Case #{caseData?.caseNumber || "N/A"}
                              </p>
                            </CardHeader>
                            
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
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
                              </div>
                              
                              {hearing.description && (
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground">Description:</p>
                                  <p className="text-sm">{hearing.description}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                                <div>
                                  <span className="text-muted-foreground">Judge:</span> {judgeUser?.name || caseData?.judge?.judgeName || "Not assigned"}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Court:</span> {caseData?.courtRoom || hearing.location?.split(',')[0] || "Not specified"}
                                </div>
                              </div>
                              
                              <div className="flex justify-end space-x-2 mt-4">
                                {userData?.role === 'judge' && hearing.status === "scheduled" && (
                                  <Button size="sm" variant="outline" asChild>
                                    <Link to={`/hearings`}>Manage Hearing</Link>
                                  </Button>
                                )}
                                
                                <Button size="sm" asChild>
                                  <Link to={`/cases/${hearing.caseId}`}>View Case</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
