
import { useState, useEffect } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { User } from "@/services/types";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Star, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper function to get lawyer rating since it's not in the User type
const getLawyerRating = (lawyer: User): number => {
  // Generate a random rating between 3 and 5 if not available
  // In a real app, this would come from the database
  if (lawyer.casesWon && lawyer.casesHandled) {
    const winRate = lawyer.casesWon / lawyer.casesHandled;
    // Convert win rate to a rating between 3 and 5
    return Math.min(5, Math.max(3, 3 + winRate * 2));
  }
  return 3 + Math.random() * 2;
};

interface RequestDefenseLawyerProps {
  caseId: string;
}

export const RequestDefenseLawyer = ({ caseId }: RequestDefenseLawyerProps) => {
  const { userData } = useFirebaseAuth();
  const { getAllLawyers, sendDefenseCaseRequest, getCaseById } = useFirebaseData();
  const { toast } = useToast();

  const [lawyers, setLawyers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState<User | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [caseDetails, setCaseDetails] = useState<any>(null);

  // Get case details
  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (caseId) {
        const details = await getCaseById(caseId);
        setCaseDetails(details);
      }
    };
    fetchCaseDetails();
  }, [caseId, getCaseById]);

  // Fetch lawyers
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        const allLawyers = await getAllLawyers();
        setLawyers(allLawyers);
      } catch (error) {
        console.error("Error fetching lawyers:", error);
        toast({
          title: "Error",
          description: "Failed to load lawyers. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, [getAllLawyers, toast]);

  // Filter lawyers based on search query and specialization
  const filteredLawyers = lawyers.filter(lawyer => {
    // Only show users with role "lawyer"
    if (lawyer.role !== "lawyer") return false;
    
    const matchesSearch =
      searchQuery === "" ||
      (lawyer.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (lawyer.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesSpecialization =
      specialization === "all" ||
      lawyer.specialization === specialization;
      
    return matchesSearch && matchesSpecialization;
  });

  const handleRequestDefense = async (lawyerId: string) => {
    if (!userData?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to request a defense lawyer.",
        variant: "destructive",
      });
      return;
    }

    if (!requestMessage.trim()) {
      toast({
        title: "Error",
        description: "Please provide a message for the lawyer.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await sendDefenseCaseRequest(
        caseId,
        userData.id,
        lawyerId,
        requestMessage
      );

      toast({
        title: "Request Sent",
        description: "Your defense request has been sent to the lawyer.",
      });
      setRequestMessage("");
      setSelectedLawyer(null);
    } catch (error) {
      console.error("Error sending defense request:", error);
      toast({
        title: "Error",
        description: "Failed to send defense request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <p>Loading lawyers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {caseDetails && (
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium">Case Information:</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <span className="text-sm text-muted-foreground">Case Number:</span>
              <p className="text-sm">{caseDetails.caseNumber}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Case Title:</span>
              <p className="text-sm">{caseDetails.title}</p>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">Plaintiff:</span>
              <p className="text-sm">{caseDetails.plaintiff?.name}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex-grow">
          <Input
            placeholder="Search lawyers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="border rounded p-2 h-10 min-w-[180px]"
          >
            <option value="all">All Specializations</option>
            <option value="civil">Civil</option>
            <option value="criminal">Criminal</option>
            <option value="family">Family</option>
            <option value="corporate">Corporate</option>
            <option value="tax">Tax</option>
          </select>
        </div>
      </div>

      {filteredLawyers.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No Lawyers Found</p>
          <p className="text-muted-foreground mt-2">
            Try adjusting your search criteria or specialization filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLawyers.map((lawyer) => (
            <Card key={lawyer.id}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={lawyer.avatarUrl} />
                    <AvatarFallback>{lawyer.name?.charAt(0) || "L"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{lawyer.name || "Unknown"}</CardTitle>
                    <div className="mt-1 flex items-center text-sm">
                      <div className="flex items-center text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(getLawyerRating(lawyer))
                                ? "fill-current"
                                : "stroke-current fill-none"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({lawyer.casesHandled || "0"} cases)
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <Badge className="mb-2" variant="outline">
                  {lawyer.specialization || "General Practice"}
                </Badge>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {lawyer.specialization 
                    ? `Specializes in ${lawyer.specialization} law cases with ${lawyer.yearsOfExperience || 'several'} years of experience.` 
                    : "Experienced legal professional ready to handle your case."}
                </p>
              </CardContent>
              <CardFooter>
                {selectedLawyer?.id === lawyer.id ? (
                  <div className="space-y-4 w-full">
                    <Textarea
                      placeholder="Write a message explaining your defense needs..."
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full"
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedLawyer(null)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleRequestDefense(lawyer.id)}
                        disabled={submitting || !requestMessage.trim()}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Send Request
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedLawyer(lawyer)}
                    className="w-full"
                  >
                    Request Defense
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
