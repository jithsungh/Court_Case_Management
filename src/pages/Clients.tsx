
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserRound, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { User } from "@/services/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getUserCollectionName } from "@/firebase/services/authService";

const Clients = () => {
  const { userData } = useFirebaseAuth();
  const { cases } = useFirebaseData();
  const [lawyerClients, setLawyerClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the lawyer's clients from Firestore
    const fetchLawyerClients = async () => {
      if (!userData || userData.role !== 'lawyer') return;
      
      try {
        console.log("Clients: Fetching clients for lawyer", userData.id);
        setLoading(true);
        
        // First, get the lawyer document to check for the clients array
        const lawyerDocRef = doc(db, getUserCollectionName('lawyer'), userData.id);
        const lawyerDocSnap = await getDoc(lawyerDocRef);
        
        if (lawyerDocSnap.exists()) {
          const lawyerData = lawyerDocSnap.data();
          const clientIds = lawyerData.clients || [];
          
          console.log("Clients: Found client IDs in lawyer document:", clientIds);
          
          if (clientIds.length === 0) {
            setLawyerClients([]);
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
          
          console.log("Clients: Fetched client data:", validClients);
          setLawyerClients(validClients);
        } else {
          console.log("Clients: Lawyer document not found");
          setLawyerClients([]);
        }
      } catch (error) {
        console.error("Error fetching lawyer clients:", error);
        setLawyerClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLawyerClients();
  }, [userData]);

  if (!userData || userData.role !== 'lawyer') {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Access denied</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-court-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Clients</h1>
        <p className="text-muted-foreground">Manage your client relationships</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lawyerClients.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No clients found. Accept case requests or send messages to clients to add them to your client list.</p>
              <div className="flex justify-center mt-4">
                <Button asChild variant="outline">
                  <Link to="/case-requests">View Case Requests</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          lawyerClients.map(client => {
            const clientCases = cases.filter(c => c.clientId === client.id && c.lawyerId === userData.id);
            
            return (
              <Card key={client.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage src={client.avatarUrl} />
                        <AvatarFallback>{client.name?.charAt(0) || 'C'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{client.name || client.email?.split('@')[0] || 'Client'}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {clientCases.length} {clientCases.length === 1 ? 'case' : 'cases'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <UserRound className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Client</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center text-sm">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Phone: {client.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to={`/messages?recipient=${client.id}`}>Contact</Link>
                    </Button>
                    {clientCases.length > 0 && (
                      <Button size="sm" className="flex-1" asChild>
                        <Link to={`/cases/${clientCases[0].id}`}>View Case</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Clients;
