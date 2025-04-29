
import { useState } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext.tsx";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Users, 
  UserCheck, 
  Gavel,
  Briefcase,
  LogOut,
  Menu,
  X,
  User,
  Shield
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  shown: boolean;
  setShown: (shown: boolean) => void;
}

const Sidebar = ({ shown, setShown }: SidebarProps) => {
  const { user, userData, signOut } = useFirebaseAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const toggleSidebar = () => {
    setShown(!shown);
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex items-center space-x-3 p-3 rounded-md transition-colors
      ${isActive 
        ? "bg-primary text-primary-foreground" 
        : "hover:bg-accent"}
      ${!shown && !isMobile ? "justify-center px-2" : ""}`;
  };

  const renderLinkText = (text: string) => {
    return shown || isMobile ? <span>{text}</span> : null;
  };

  const renderNavLink = (to: string, icon: React.ReactNode, text: string) => {
    const IconComponent = () => <>{icon}</>;
    
    return (
      <NavLink to={to} className={getNavLinkClass}>
        {!shown && !isMobile ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <IconComponent />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{text}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <IconComponent />
            {renderLinkText(text)}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`
        court-sidebar bg-background h-screen flex flex-col border-r 
        transition-all duration-300 overflow-hidden
        ${shown ? 'w-64' : isMobile ? 'fixed -translate-x-full' : 'w-16'}
        ${isMobile ? 'fixed z-50 shadow-lg' : 'relative'}
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {(shown || isMobile) && <span className="font-bold text-lg">CourtWise</span>}
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-accent"
            aria-label={shown ? "Close sidebar" : "Open sidebar"}
          >
            {shown ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="p-4 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`
                flex items-center space-x-3 cursor-pointer
                ${!shown && !isMobile ? "justify-center" : ""}
              `}>
                <Avatar>
                  <AvatarImage src={user?.photoURL} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                {(shown || isMobile) && (
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{user?.displayName || userData?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userData?.role || 'User'}</p>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile/edit")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Dashboard link for all user types */}
          {renderNavLink("/dashboard", <LayoutDashboard size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Dashboard")}

          {/* Client specific links */}
          {userData?.role === 'client' && (
            <>
              {renderNavLink("/cases", <FileText size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "My Cases")}
              {renderNavLink("/defense-cases", <Shield size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Defense Cases")}
              {renderNavLink("/find-lawyer", <Briefcase size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Find Lawyer")}
            </>
          )}

          {/* Lawyer specific links */}
          {userData?.role === 'lawyer' && (
            <>
              {renderNavLink("/cases", <FileText size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Cases")}
              {renderNavLink("/file-case", <FileText size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "File a Case")}
              {renderNavLink("/case-requests", <UserCheck size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Case Requests")}
              {renderNavLink("/clients", <Users size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Clients")}
            </>
          )}

          {/* Clerk specific links */}
          {userData?.role === 'clerk' && (
            <>
              {renderNavLink("/new-cases", <FileText size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "New Cases")}
              {renderNavLink("/hearings", <Calendar size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Hearings")}
            </>
          )}

          {/* Judge specific links */}
          {userData?.role === 'judge' && (
            <>
              {renderNavLink("/docket", <FileText size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "My Docket")}
              {renderNavLink("/case-summary", <Gavel size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Case Summary")}
            </>
          )}

          {/* Common links for all user types */}
          {renderNavLink("/messages", <MessageSquare size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Messages")}
          {renderNavLink("/schedule", <Calendar size={20} className={!shown && !isMobile ? "mx-auto" : ""} />, "Schedule")}
        </nav>

        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className={`w-full ${!shown && !isMobile ? "px-2 justify-center" : ""}`}
          >
            <LogOut size={20} className={!shown && !isMobile ? "mx-auto" : ""} />
            {(shown || isMobile) && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
