
import { useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext"; // Use FirebaseAuthContext
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Scale } from "lucide-react";

interface JudgementFormProps {
  caseId: string;
  onJudgementSubmit: (judgement: {
    decision: 'approved' | 'denied' | 'partial';
    ruling: string;
    courtRoomNumber: string;
    judgeName: string;
  }) => void;
}

export function JudgementForm({ caseId, onJudgementSubmit }: JudgementFormProps) {
  const { userData } = useFirebaseAuth(); // Use userData from FirebaseAuthContext
  const { toast } = useToast();
  const [decision, setDecision] = useState<'approved' | 'denied' | 'partial'>('denied');
  const [ruling, setRuling] = useState('');
  const [courtRoomNumber, setCourtRoomNumber] = useState('');
  const [inCourtConfirmation, setInCourtConfirmation] = useState(false);
  
  const handleSubmit = () => {
    if (!courtRoomNumber) {
      toast({
        title: "Error",
        description: "Court room number is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!inCourtConfirmation) {
      toast({
        title: "Confirmation Required",
        description: "You must confirm that you are physically present in the court room",
        variant: "destructive",
      });
      return;
    }

    onJudgementSubmit({
      decision,
      ruling,
      courtRoomNumber,
      judgeName: userData?.name || '',
    });
  };

  if (!userData || userData.role !== 'judge') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Court Judgement</CardTitle>
        <CardDescription>This ruling can only be issued from a physical court room location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">Important Notice</p>
            <p className="text-sm text-yellow-700">
              Judicial decisions can only be issued while physically present in a court room, 
              as required by law for transparency and record-keeping purposes.
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="court-room">Court Room Number</Label>
          <Input
            id="court-room"
            placeholder="Enter court room number"
            value={courtRoomNumber}
            onChange={(e) => setCourtRoomNumber(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="decision">Decision</Label>
          <Select value={decision} onValueChange={(value: 'approved' | 'denied' | 'partial') => setDecision(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
              <SelectItem value="partial">Partially Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ruling">Ruling Details</Label>
          <Textarea
            id="ruling"
            placeholder="Enter detailed ruling and justification"
            value={ruling}
            onChange={(e) => setRuling(e.target.value)}
            className="min-h-[150px]"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox id="in-court" checked={inCourtConfirmation} onCheckedChange={(checked) => setInCourtConfirmation(checked as boolean)} />
          <Label htmlFor="in-court" className="text-sm font-medium">
            I confirm that I am physically present in court room {courtRoomNumber} while issuing this judgement
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog>
          <DialogTrigger asChild>
            <Button disabled={!ruling || !courtRoomNumber || !inCourtConfirmation}>
              <Scale className="h-4 w-4 mr-2" />
              Issue Judgement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Judgement</DialogTitle>
              <DialogDescription>
                You are about to issue an official court judgement as {userData?.name}.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium">Decision: {decision === 'approved' ? 'Approved' : decision === 'denied' ? 'Denied' : 'Partially Approved'}</p>
              <p className="text-sm line-clamp-3">{ruling}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>Cancel</Button>
              <Button onClick={handleSubmit}>Confirm and Issue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
