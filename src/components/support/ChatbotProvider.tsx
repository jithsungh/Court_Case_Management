
import { useState, useEffect } from "react";
import { Chatbot } from "@/components/support/Chatbot";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { Bot, X } from "lucide-react";
import { useLocation } from "react-router-dom";

export function ChatbotProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [minimized, setMinimized] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const location = useLocation();
  const { userData, isAuthenticated } = useFirebaseAuth();

  // Reset chat when navigating to a different page
  useEffect(() => {
    setMinimized(true);
  }, [location.pathname]);

  // Make sure the chatbot is always within the viewport
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60),
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleChat = () => {
    if (minimized) {
      setMinimized(false);
      setIsOpen(true);
    } else {
      setMinimized(true);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setMinimized(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button

    const chatbotButton = e.currentTarget.getBoundingClientRect();
    setRel({
      x: e.clientX - chatbotButton.left,
      y: e.clientY - chatbotButton.top,
    });

    setDragging(true);
    e.stopPropagation();
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;

    setPosition({
      x: Math.max(0, Math.min(e.clientX - rel.x, window.innerWidth - 60)),
      y: Math.max(0, Math.min(e.clientY - rel.y, window.innerHeight - 60)),
    });

    e.stopPropagation();
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  // Don't show chat on login or public pages
  if (!isAuthenticated) return null;
  
  return (
    <div className="fixed bottom-0 right-0 z-50 p-4">
      {isOpen && !minimized && (
        <div className="fixed bottom-20 right-6">
          <Chatbot onClose={closeChat} />
        </div>
      )}

      <div
        className={`chatbot-launcher cursor-move absolute bottom-0 right-0`}
        style={{ bottom: `${position.y}px`, right: `${position.x}px` }}
        onMouseDown={handleMouseDown}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleChat}
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg"
              >
                {minimized ? (
                  <Bot size={24} />
                ) : (
                  <X size={24} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{minimized ? "Open chat assistant" : "Close chat"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
