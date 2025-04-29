
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Message } from "@/services/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";
import { formatTimestamp, timestampToDate } from "@/utils/dateUtils";
import { useEffect, useState } from "react";
import { subscribeToRecentMessagesForUser } from "@/firebase/services/messageService";
import { useFirebaseData } from "@/context/FirebaseDataContext";
import { Loader2 } from "lucide-react";

export function RecentMessages() {
  const { userData } = useFirebaseAuth();
  const { getUserById } = useFirebaseData();
  const [loading, setLoading] = useState(true);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);

  useEffect(() => {
    let unsubscribe = () => {};
    
    if (userData?.id) {
      setLoading(true);
      
      // Subscribe to recent messages
      unsubscribe = subscribeToRecentMessagesForUser(
        userData.id,
        10,
        (messages) => {
          // Process received messages
          setRecentMessages(messages);
          setLoading(false);
        }
      );
    }
    
    return () => {
      unsubscribe();
    };
  }, [userData?.id]);

  if (!userData) return null;

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>Your latest conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentMessages.length > 0 ? (
            recentMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                currentUserId={userData.id}
                getUserById={getUserById}
              />
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              No messages yet
            </p>
          )}
        </div>
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/messages">View All Messages</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageCardProps {
  message: Message;
  currentUserId: string;
  getUserById: (id: string) => any;
}

function MessageCard({
  message,
  currentUserId,
  getUserById,
}: MessageCardProps) {
  if (!message.recipientId || !message.senderId) return null;

  const isCurrentUserSender = message.senderId === currentUserId;
  const otherUserId = isCurrentUserSender
    ? message.recipientId
    : message.senderId;
  const otherUser = getUserById(otherUserId);

  if (!otherUser) return null;

  return (
    <Link to={`/messages?recipient=${otherUserId}`} className="block">
      <div className="flex items-start space-x-3 hover:bg-accent rounded-lg p-2 transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser.avatarUrl} alt={otherUser.name || "User"} />
          <AvatarFallback>
            {otherUser.name
              ? otherUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium">
              {otherUser.name || "Unknown User"}
            </p>
            <span className="text-xs text-muted-foreground">
              {message.createdAt
                ? formatTimestamp(message.createdAt, "MMM d, h:mm a")
                : "Time unknown"}
            </span>
          </div>
          <p className="text-xs line-clamp-2">
            {message.content || "No content"}
          </p>
        </div>
      </div>
    </Link>
  );
}
