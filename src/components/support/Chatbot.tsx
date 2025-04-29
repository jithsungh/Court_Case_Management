
import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, X, CornerDownLeft, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  onClose: () => void;
}

export function Chatbot({ onClose }: ChatbotProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi there! I'm your CourtWise assistant. How can I help you today?",
      role: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { userData } = useFirebaseAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Show bot is typing indicator
    setIsTyping(true);

    try {
      // In a real app, this would make an API call to your chatbot service
      // For demo, we'll simulate a response after a delay
      setTimeout(() => {
        const botResponses = [
          "I'll help you with that! Let me look into it.",
          "That's a good question about our court system.",
          "You can find more information about that in our user guides.",
          "Let me check the case details for you.",
          `As ${userData?.role || 'a user'} of the system, you have access to that information in the dashboard.`,
          "Would you like me to help you navigate to the right page?"
        ];
        
        const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
        
        const botMessage: Message = {
          id: Date.now().toString(),
          content: randomResponse,
          role: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to get chatbot response:', error);
      toast({
        title: "Error",
        description: "Unable to get a response. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container flex flex-col h-[500px] w-[350px] bg-background border rounded-lg shadow-lg overflow-hidden">
      <div className="chatbot-header bg-primary text-primary-foreground p-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot size={18} />
          <span className="font-medium">CourtWise Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-primary-foreground">
          <X size={18} />
        </Button>
      </div>
      
      <div className="chatbot-messages flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`flex max-w-[80%] ${
                message.role === 'user' 
                  ? 'flex-row-reverse items-end' 
                  : 'items-start'
              }`}
            >
              {message.role === 'user' ? (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src={userData?.avatarUrl} />
                  <AvatarFallback><User size={14} /></AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-8 w-8 mr-2 bg-primary">
                  <AvatarFallback><Bot size={14} className="text-primary-foreground" /></AvatarFallback>
                </Avatar>
              )}
              
              <div 
                className={`rounded-lg p-3 text-sm ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                {message.content}
                <div className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start">
              <Avatar className="h-8 w-8 mr-2 bg-primary">
                <AvatarFallback><Bot size={14} className="text-primary-foreground" /></AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 text-sm bg-muted flex space-x-1">
                <div className="typing-dot animate-bounce">●</div>
                <div className="typing-dot animate-bounce" style={{animationDelay: '0.2s'}}>●</div>
                <div className="typing-dot animate-bounce" style={{animationDelay: '0.4s'}}>●</div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chatbot-input border-t p-3">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[60px] resize-none flex-1"
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="h-[60px]" 
            disabled={input.trim() === '' || isTyping}
          >
            {isTyping ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          <CornerDownLeft size={12} className="mr-1" /> Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
