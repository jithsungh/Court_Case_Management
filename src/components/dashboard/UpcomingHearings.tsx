
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case, Hearing } from "@/services/types";
import { Calendar, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { 
  formatTimestamp, 
  timestampToDate, 
  isUpcomingHearing, 
  isHearingToday,
  isHearingTomorrow,
  sortHearingsByDate
} from "@/utils/dateUtils";
import { Badge } from "../ui/badge";

export function UpcomingHearings() {
  const { userData } = useFirebaseAuth();
  const { cases, hearings } = useFirebaseData();

  if (!userData) return null;

  // Filter hearings based on user role
  const getUserRelevantHearings = () => {
    if (!userData) return [];
    
    console.log("UpcomingHearings - Current user data:", userData);
    console.log("UpcomingHearings - Total hearings available:", hearings.length);

    let filteredHearings: Hearing[] = [];

    switch (userData.role) {
      case "judge":
        // For judges, show hearings where they are assigned
        filteredHearings = hearings.filter(hearing => {
          if (!hearing.caseId) return false;
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          return relatedCase?.judge?.judgeId === userData.id;
        });
        break;
      
      case "clerk":
        // For clerks, show all hearings
        filteredHearings = hearings;
        break;
      
      case "lawyer":
        // For lawyers, show hearings where they represent either party
        filteredHearings = hearings.filter(hearing => {
          if (!hearing.caseId) return false;
          
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          if (!relatedCase) return false;
          
          // Use the correct property names from the Case type
          return (relatedCase.plaintifflawyer && relatedCase.plaintifflawyer.barId === userData.id) ||
                 (relatedCase.defendantlawyer && relatedCase.defendantlawyer.barId === userData.id) ||
                 relatedCase.lawyerId === userData.id;
        });
        break;
      
      case "client":
        // For clients, show hearings where they are plaintiff or defendant
        filteredHearings = hearings.filter(hearing => {
          if (!hearing.caseId) return false;
          
          const relatedCase = cases.find(c => c.id === hearing.caseId);
          if (!relatedCase) return false;
          
          // Access clientId directly instead of nonexistent id property on plaintiff/defendant
          return relatedCase.clientId === userData.id || 
                 relatedCase.defendantClientId === userData.id;
        });
        break;
      
      default:
        filteredHearings = [];
    }

    // Only show upcoming hearings
    return filteredHearings.filter(isUpcomingHearing);
  };

  const userRelevantHearings = getUserRelevantHearings();
  console.log("UpcomingHearings - User relevant upcoming hearings:", userRelevantHearings.length);
  
  // Sort hearings by date (ascending)
  const sortedHearings = sortHearingsByDate(userRelevantHearings).slice(0, 4); // Show only the next 4 hearings

  // Count urgent hearings (today/tomorrow)
  const urgentHearingsCount = userRelevantHearings.filter(
    hearing => isHearingToday(hearing.date) || isHearingTomorrow(hearing.date)
  ).length;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Upcoming Hearings</CardTitle>
            <CardDescription>Your next scheduled court appearances</CardDescription>
          </div>
          {urgentHearingsCount > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {urgentHearingsCount} {urgentHearingsCount === 1 ? 'urgent' : 'urgent'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHearings.length > 0 ? (
            sortedHearings.map((hearing) => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                getCaseById={(id) => cases.find(c => c.id === id)}
                isUrgent={isHearingToday(hearing.date) || isHearingTomorrow(hearing.date)}
              />
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No upcoming hearings scheduled
            </p>
          )}
        </div>
        {sortedHearings.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/schedule">View All Hearings</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface HearingCardProps {
  hearing: Hearing;
  getCaseById: (id: string) => Case | undefined;
  isUrgent?: boolean;
}

function HearingCard({ hearing, getCaseById, isUrgent = false }: HearingCardProps) {
  if (!hearing.caseId) return null;

  const caseItem = getCaseById(hearing.caseId);

  if (!caseItem) return null;

  const hearingDate = timestampToDate(hearing.date);
  const isTodayHearing = hearingDate ? isHearingToday(hearing.date) : false;

  return (
    <div className={`border rounded-lg p-3 hover:bg-accent transition-colors ${isUrgent ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm mb-1">
          <Link to={`/cases/${caseItem.id}`} className="hover:underline">
            {caseItem.title || `Case #${caseItem.caseNumber || "Unknown"}`}
          </Link>
        </h4>
        {isUrgent && (
          <Badge variant={isTodayHearing ? "destructive" : "outline"} className="text-[10px] py-0 h-5">
            {isTodayHearing ? 'Today' : 'Tomorrow'}
          </Badge>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>
            {formatTimestamp(hearing.date, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>
            {formatTimestamp(hearing.date, "h:mm a")}
          </span>
        </div>
        <div className="flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{hearing.location || "Location not set"}</span>
        </div>
      </div>
    </div>
  );
}
