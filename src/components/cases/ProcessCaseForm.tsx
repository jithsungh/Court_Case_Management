
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Case, User } from "@/services/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";
import { createTimestamp } from "@/utils/dateUtils";
import { Textarea } from "../ui/textarea";

// Define the schema for the form
const formSchema = z.object({
  hearingDate: z.date({
    required_error: "Hearing date is required",
  }),
  hearingTime: z.string({
    required_error: "Hearing time is required",
  }),
  courtRoom: z.string().min(1, {
    message: "Court room number is required",
  }),
  judgeId: z.string().min(1, {
    message: "Judge assignment is required",
  }),
  description: z.string().optional(),
  location: z.string().min(1, {
    message: "Location is required",
  }),
});

type ProcessCaseFormProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: Case | null;
};

export function ProcessCaseForm({
  isOpen,
  onClose,
  selectedCase,
}: ProcessCaseFormProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { updateCase, getUsersByRole, addHearing } = useFirebaseData();
  const { userData } = useFirebaseAuth();
  const [judges, setJudges] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all judges for the dropdown
  useEffect(() => {
    const fetchJudges = async () => {
      const judgesList = await getUsersByRole("judge");
      setJudges(judgesList);
    };
    fetchJudges();
  }, [getUsersByRole]);

  // Set up the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hearingTime: "09:00",
      courtRoom: "",
      judgeId: "",
      description: "",
      location: "",
    },
  });

  useEffect(() => {
    if (selectedCase?.courtRoom) {
      form.setValue("courtRoom", selectedCase.courtRoom);
      form.setValue("location", `Courtroom ${selectedCase.courtRoom}, City Courthouse`);
    }
  }, [selectedCase, form]);

  // When the form is submitted
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedCase) return;
    
    setIsSubmitting(true);

    try {
      // Format the hearing date and time as a Timestamp
      const hearingDateTime = new Date(values.hearingDate);
      const [hours, minutes] = values.hearingTime.split(":");
      hearingDateTime.setHours(parseInt(hours), parseInt(minutes));
      
      const selectedJudge = judges.find(judge => judge.id === values.judgeId);
      const judgeName = selectedJudge ? selectedJudge.name : "Unknown Judge";
      
      // Update the case with scheduling information
      await updateCase(selectedCase.id, {
        status: "scheduled",
        nextHearingDate: createTimestamp(hearingDateTime),
        courtRoom: values.courtRoom,
        judge: {
          judgeId: values.judgeId,
          judgeName: judgeName
        }
      });
      
      // Create a hearing record
      await addHearing({
        caseId: selectedCase.id,
        date: createTimestamp(hearingDateTime),
        location: values.location || `Courtroom ${values.courtRoom}`,
        description: values.description || `Initial hearing for ${selectedCase.title}`,
        status: "scheduled",
        participants: [
          selectedCase.clientId,
          selectedCase.lawyerId || "",
          selectedCase.defendantClientId || "",
          selectedCase.defendantLawyerId || "",
          values.judgeId
        ].filter(Boolean),
      });

      toast({
        title: "Case Scheduled",
        description: "Hearing has been scheduled successfully",
      });

      onClose();
      navigate(`/cases/${selectedCase.id}`);
    } catch (error) {
      console.error("Error scheduling case:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule the hearing",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedCase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Process Case: {selectedCase.caseNumber}</DialogTitle>
          <DialogDescription>
            Schedule a hearing and assign a judge to this case.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hearingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Hearing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hearingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hearing Time</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        <Input type="time" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courtRoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Court Room</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter court room number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="judgeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Judge</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a judge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {judges.map((judge) => (
                          <SelectItem key={judge.id} value={judge.id}>
                            {judge.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter hearing location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hearing Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter hearing details or instructions" 
                      className="resize-none" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Hearing"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
