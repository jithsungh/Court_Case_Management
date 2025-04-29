
import { useState, useEffect } from "react";
import { User } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, Search } from "lucide-react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getUserCollectionName } from "@/firebase/services/authService";

interface PlaintiffSelectorProps {
  value: User | null;
  onChange: (client: User | null) => void;
  options: User[];
}

export const PlaintiffSelector = ({
  value,
  onChange,
  options,
}: PlaintiffSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClients, setFilteredClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [lawyerClients, setLawyerClients] = useState<User[]>([]);
  const { userData } = useFirebaseAuth();

  // Fetch lawyer's clients from Firestore
  useEffect(() => {
    const fetchLawyerClients = async () => {
      if (!userData || userData.role !== 'lawyer') return;
      
      try {
        console.log("PlaintiffSelector: Fetching clients for lawyer", userData.id);
        setLoading(true);
        
        // Get the lawyer document to check for the clients array
        const lawyerDocRef = doc(db, getUserCollectionName('lawyer'), userData.id);
        const lawyerDocSnap = await getDoc(lawyerDocRef);
        
        if (lawyerDocSnap.exists()) {
          const lawyerData = lawyerDocSnap.data();
          const clientIds = lawyerData.clients || [];
          
          console.log("PlaintiffSelector: Found client IDs in lawyer document:", clientIds);
          
          if (clientIds.length === 0) {
            setLawyerClients([]);
            setFilteredClients([]);
            setLoading(false);
            return;
          }
          
          // Fetch client data for each ID
          const clientPromises = clientIds.map(async (clientId: string) => {
            const clientDocRef = doc(db, getUserCollectionName('client'), clientId);
            const clientDocSnap = await getDoc(clientDocRef);
            
            if (clientDocSnap.exists()) {
              const clientData = clientDocSnap.data() as User;
              return { ...clientData, id: clientDocSnap.id };
            }
            return null;
          });
          
          const clientResults = await Promise.all(clientPromises);
          const validClients = clientResults.filter(client => client !== null) as User[];
          
          console.log("PlaintiffSelector: Fetched client data:", validClients);
          setLawyerClients(validClients);
          setFilteredClients(validClients);
        }
      } catch (error) {
        console.error("Error fetching lawyer clients:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLawyerClients();
  }, [userData]);

  // Filter clients based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = lawyerClients.filter(
        (client) =>
          client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(lawyerClients);
    }
  }, [searchTerm, lawyerClients]);

  const handleSelectClient = (client: User) => {
    onChange(client);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="plaintiff">Plaintiff (Person Filing the Case)</Label>

      {value ? (
        <div className="flex items-center justify-between border rounded-md p-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={value.avatarUrl} alt={value.name} />
              <AvatarFallback>
                {value.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{value.name}</p>
              <p className="text-xs text-muted-foreground">{value.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Change
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-auto py-2"
          onClick={() => setOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          <span>Select Client as Plaintiff</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Plaintiff</DialogTitle>
            <DialogDescription>
              Select a client from your client list or search for a specific
              client.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] mt-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-court-blue"></div>
              </div>
            ) : filteredClients.length > 0 ? (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <Button
                    key={client.id}
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto"
                    onClick={() => handleSelectClient(client)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={client.avatarUrl} alt={client.name} />
                        <AvatarFallback>
                          {client.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {userData?.role === 'lawyer' ? 
                    "No clients found. Contact clients through messages first to add them to your client list." :
                    "No clients found"
                  }
                </p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
