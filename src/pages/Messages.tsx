
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { ArrowRightIcon, Loader2, MessageCircle, SearchIcon, Send, UserCircleIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "react-router-dom";
import { Message, User } from "@/services/types";
import { useToast } from "@/hooks/use-toast";
import { 
  sendMessage, 
  subscribeToMessagesBetweenUsers, 
  getMessagesBetweenUsers 
} from "@/firebase/services/messageService";

const Messages = () => {
  const { userData } = useFirebaseAuth();
  const { getUserById } = useFirebaseData();
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchParams] = useSearchParams();
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<() => void>(() => {});
  
  const caseId = searchParams.get('case');
  const recipientId = searchParams.get('recipient');
  const caseItem = caseId ? useFirebaseData().getCaseById(caseId) : null;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (recipientId) {
      setSelectedUser(recipientId);
    } else if (caseItem && userData) {
      if (userData.role === 'client' && caseItem.lawyerId) {
        setSelectedUser(caseItem.lawyerId);
      } else if ((userData.role === 'lawyer' || userData.role === 'judge' || userData.role === 'clerk') && caseItem.clientId) {
        setSelectedUser(caseItem.clientId);
      }
    }
  }, [caseItem, userData, recipientId]);

  // Load initial messages when a user is selected
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!userData || !selectedUser) return;
      
      try {
        setLoading(true);
        console.log(`Loading initial messages between ${userData.id} and ${selectedUser}`);
        
        const selectedUserData = getUserById(selectedUser);
        if (!selectedUserData) {
          console.error(`Selected user ${selectedUser} not found in data context`);
          toast({
            title: "Error",
            description: "Could not find user data. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // First load existing messages
        const existingMessages = await getMessagesBetweenUsers(
          userData.id,
          userData.role,
          selectedUser,
          selectedUserData.role
        );
        
        console.log(`Loaded ${existingMessages.length} initial messages`);
        
        // Sort messages by timestamp (newest last)
        const sortedMessages = existingMessages.sort((a, b) => {
          return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
        });
        
        setUserMessages(sortedMessages);
        setLoading(false);
        // Scroll to bottom after loading initial messages
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error loading initial messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    loadInitialMessages();
  }, [userData, selectedUser, getUserById, toast]);

  // Set up real-time message subscription when selected user changes
  useEffect(() => {
    if (!userData || !selectedUser) return;
    
    try {
      console.log(`Setting up message subscription between ${userData.id} and ${selectedUser}`);
      
      const selectedUserData = getUserById(selectedUser);
      if (!selectedUserData) {
        console.error(`Selected user ${selectedUser} not found in data context`);
        return;
      }
      
      // Clean up previous subscription
      unsubscribeRef.current();
      
      // Subscribe to real-time messages
      unsubscribeRef.current = subscribeToMessagesBetweenUsers(
        userData.id,
        userData.role,
        selectedUser,
        selectedUserData.role,
        (messages) => {
          console.log(`Received ${messages.length} messages in real-time`);
          
          // Sort messages by timestamp (newest last)
          const sortedMessages = messages.sort((a, b) => {
            return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
          });
          
          setUserMessages(sortedMessages);
          
          // Scroll to bottom on new messages if user was already at bottom
          setTimeout(scrollToBottom, 100);
        }
      );
    } catch (error) {
      console.error("Error setting up message subscription:", error);
    }
    
    // Clean up subscription when component unmounts or selected user changes
    return () => {
      console.log("Cleaning up message subscription");
      unsubscribeRef.current();
    };
  }, [userData, selectedUser, getUserById]);

  // Scroll to bottom when sending a new message
  useEffect(() => {
    if (sendingMessage === false) {
      scrollToBottom();
    }
  }, [sendingMessage]);

  const getUsers = () => {
    if (!userData) return [];
    
    const allUsers = [];

    if (userData.role === 'client') {
      const acceptedLawyers = useFirebaseData().getAcceptedLawyers(userData.id);
      return acceptedLawyers;
    }
    else if (userData.role === 'lawyer') {
      if (filter === 'clients') {
        allUsers.push(...getUsersByRole('client'));
      } else if (filter === 'lawyers') {
        allUsers.push(...getUsersByRole('lawyer').filter(u => u.id !== userData.id));
      } else if (filter === 'clerks') {
        allUsers.push(...getUsersByRole('clerk'));
      } else {
        allUsers.push(...getUsersByRole('client'));
        allUsers.push(...getUsersByRole('lawyer').filter(u => u.id !== userData.id));
        allUsers.push(...getUsersByRole('clerk'));
      }
    } 
    else if (userData.role === 'clerk') {
      if (filter === 'lawyers') {
        allUsers.push(...getUsersByRole('lawyer'));
      } else if (filter === 'clerks') {
        allUsers.push(...getUsersByRole('clerk').filter(u => u.id !== userData.id));
      } else if (filter === 'judges') {
        allUsers.push(...getUsersByRole('judge'));
      } else {
        allUsers.push(...getUsersByRole('lawyer'));
        allUsers.push(...getUsersByRole('clerk').filter(u => u.id !== userData.id));
        allUsers.push(...getUsersByRole('judge'));
      }
    } 
    else if (userData.role === 'judge') {
      if (filter === 'clerks') {
        allUsers.push(...getUsersByRole('clerk'));
      } else if (filter === 'judges') {
        allUsers.push(...getUsersByRole('judge').filter(u => u.id !== userData.id));
      } else {
        allUsers.push(...getUsersByRole('clerk'));
        allUsers.push(...getUsersByRole('judge').filter(u => u.id !== userData.id));
      }
    }

    if (searchText) {
      return allUsers.filter(u => u.name.toLowerCase().includes(searchText.toLowerCase()));
    }
    
    return allUsers;
  };

  const getUsersByRole = (role: 'client' | 'lawyer' | 'clerk' | 'judge') => {
    return Object.values(useFirebaseData().users).filter(u => u.role === role);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !userData) return;
    
    const recipient = getUserById(selectedUser);
    if (!recipient) {
      toast({
        title: "Error",
        description: "Could not find recipient information.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSendingMessage(true);
      console.log("Sending message with data:", {
        senderId: userData.id,
        senderRole: userData.role,
        recipientId: selectedUser,
        recipientRole: recipient.role,
        content: messageText,
        caseId: caseId || undefined
      });
      
      await sendMessage({
        senderId: userData.id,
        senderRole: userData.role,
        recipientId: selectedUser,
        recipientRole: recipient.role,
        content: messageText,
        caseId: caseId || undefined
      });
      
      setMessageText('');
      setSendingMessage(false);
      
      // No need to manually update messages array here
      // The onSnapshot listener will automatically update with the new message
    } catch (error) {
      console.error("Error sending message:", error);
      setSendingMessage(false);
      toast({
        title: "Failed to Send",
        description: "Your message could not be sent. Please try again.",
        variant: "destructive"
      });
    }
  };

  const users = getUsers();
  const selectedUserObj = selectedUser ? getUserById(selectedUser) : null;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Communicate with parties involved in your cases</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 h-full">
        <Card className="md:col-span-1 flex flex-col h-full">
          <CardHeader className="space-y-4 pb-2">
            <div className="flex items-center border rounded-md">
              <Input 
                placeholder="Search users..." 
                className="border-0 focus:ring-0" 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              <SearchIcon className="h-5 w-5 me-2 text-muted-foreground" />
            </div>
            
            {userData?.role !== 'client' && (
              <Tabs defaultValue={filter} onValueChange={setFilter}>
                {getFilterTabs()}
                <div className="h-4"></div>
              </Tabs>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto space-y-2 pb-0">
            {users?.length > 0 ? (
              users.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`p-2 rounded-md cursor-pointer flex items-center space-x-3 ${
                    selectedUser === user.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-width-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UserCircleIcon className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                <p className="mt-2 text-muted-foreground">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 flex flex-col h-full">
          {selectedUserObj ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedUserObj.avatarUrl} alt={selectedUserObj.name} />
                    <AvatarFallback>
                      {selectedUserObj.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedUserObj.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedUserObj.role.charAt(0).toUpperCase() + selectedUserObj.role.slice(1)}
                      {caseItem && ` • Case: ${caseItem.caseNumber || caseItem.id}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">Loading messages...</span>
                  </div>
                ) : userMessages.length > 0 ? (
                  <>
                    {userMessages.map(message => {
                      const isCurrentUser = message.senderId === userData?.id;
                      const messageTime = message.createdAt?.seconds 
                        ? new Date(message.createdAt.seconds * 1000) 
                        : new Date();
                        
                      return (
                        <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`rounded-lg p-3 max-w-[80%] ${
                            isCurrentUser ? 'bg-primary text-white' : 'bg-muted'
                          }`}>
                            <p>{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            }`}>
                              {formatDistanceToNow(messageTime, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="mt-2 text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start the conversation by sending a message below.</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex w-full space-x-2">
                  <Input 
                    placeholder="Type your message..." 
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="flex-1"
                    disabled={sendingMessage}
                  />
                  <Button type="submit" disabled={!messageText.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-1" /> Send
                      </>
                    )}
                  </Button>
                </form>
              </CardFooter>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="mt-2 text-lg font-medium">Select a conversation</p>
              <p className="text-muted-foreground">Choose a user from the left panel to start chatting</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const getFilterTabs = () => {
  const { userData } = useFirebaseAuth();
  
  if (!userData) return null;
  
  if (userData.role === 'lawyer') {
    return (
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="clients">Clients</TabsTrigger>
        <TabsTrigger value="lawyers">Lawyers</TabsTrigger>
        <TabsTrigger value="clerks">Clerks</TabsTrigger>
      </TabsList>
    );
  }
  
  if (userData.role === 'clerk') {
    return (
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="lawyers">Lawyers</TabsTrigger>
        <TabsTrigger value="clerks">Clerks</TabsTrigger>
        <TabsTrigger value="judges">Judges</TabsTrigger>
      </TabsList>
    );
  }
  
  if (userData.role === 'judge') {
    return (
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="clerks">Clerks</TabsTrigger>
        <TabsTrigger value="judges">Judges</TabsTrigger>
      </TabsList>
    );
  }
  
  return null;
};

export default Messages;
