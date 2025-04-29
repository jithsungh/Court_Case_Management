
import React, { useState } from "react";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Case, GovernmentIdType } from "@/services/types";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/utils/dateUtils";
import { Search, Briefcase, User } from "lucide-react";
import { Link } from "react-router-dom";

export const FindCasesAgainstMe = () => {
  const { findCasesAgainstMe, claimDefendantIdentity } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  const { toast } = useToast();

  const [governmentIdType, setGovernmentIdType] = useState<GovernmentIdType>("Aadhar");
  const [governmentIdNumber, setGovernmentIdNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [foundCases, setFoundCases] = useState<Case[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!governmentIdNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a government ID number to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const cases = await findCasesAgainstMe(
        governmentIdType,
        governmentIdNumber,
        phoneNumber.trim() ? phoneNumber : undefined
      );
      setFoundCases(cases);
      
      if (cases.length === 0) {
        toast({
          title: "No Cases Found",
          description: "No cases were found with the provided information.",
        });
      } else {
        toast({
          title: "Cases Found",
          description: `Found ${cases.length} case(s) matching your information.`,
        });
      }
    } catch (error) {
      console.error("Error searching for cases:", error);
      toast({
        title: "Search Failed",
        description: "There was an error searching for cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClaimIdentity = async (caseId: string) => {
    if (!userData?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to claim your identity",
        variant: "destructive",
      });
      return;
    }

    try {
      await claimDefendantIdentity(caseId, userData.id);
      
      // Update the local state to show the case as claimed
      setFoundCases(prev => 
        prev.map(c => c.id === caseId ? { ...c, defendantClientId: userData.id } : c)
      );
      
      toast({
        title: "Identity Claimed",
        description: "You have been registered as the defendant in this case.",
      });
    } catch (error) {
      console.error("Error claiming defendant identity:", error);
      toast({
        title: "Operation Failed",
        description: "Failed to claim your identity. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Cases Filed Against You
          </CardTitle>
          <CardDescription>
            Search for any court cases where you are named as a defendant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idType">Government ID Type</Label>
                <Select
                  value={governmentIdType}
                  onValueChange={(value) => setGovernmentIdType(value as GovernmentIdType)}
                >
                  <SelectTrigger id="idType">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhar">Aadhar</SelectItem>
                    <SelectItem value="PAN">PAN</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Voter ID">Voter ID</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">Government ID Number</Label>
                <Input
                  id="idNumber"
                  value={governmentIdNumber}
                  onChange={(e) => setGovernmentIdNumber(e.target.value)}
                  placeholder="Enter your ID number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number for additional matching"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search for Cases"}
          </Button>
        </CardFooter>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Search Results</h2>
          {foundCases.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <p>No cases found with the provided information.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {foundCases.map((caseItem) => (
                <Card key={caseItem.id}>
                  <CardHeader>
                    <CardTitle>{caseItem.title}</CardTitle>
                    <CardDescription>Case #{caseItem.caseNumber}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        <span className="capitalize">{caseItem.status.replace("_", " ")}</span>
                      </div>
                      <div>
                        <span className="font-medium">Filed Date:</span>{" "}
                        {formatTimestamp(caseItem.filedDate, "MMMM d, yyyy")}
                      </div>
                      <div>
                        <span className="font-medium">Plaintiff:</span>{" "}
                        {caseItem.plaintiff.name}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>{" "}
                        <p className="mt-1">{caseItem.description}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" asChild>
                      <Link to={`/cases/${caseItem.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {!caseItem.defendantClientId ? (
                      <Button 
                        onClick={() => handleClaimIdentity(caseItem.id)}
                        disabled={!userData}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Claim as My Case
                      </Button>
                    ) : (
                      caseItem.defendantClientId === userData?.id ? (
                        <Button variant="secondary" asChild>
                          <Link to="/find-lawyer">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Find Defense Lawyer
                          </Link>
                        </Button>
                      ) : (
                        <Button disabled>Already Claimed</Button>
                      )
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindCasesAgainstMe;
