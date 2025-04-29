
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

const MainLayout = () => {
  const [sidebarShown, setSidebarShown] = useState(true);
  const { loading, user } = useFirebaseAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarShown(false);
      } else {
        setSidebarShown(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state based on window width

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: location } });
    }
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-xl font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar shown={sidebarShown} setShown={setSidebarShown} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MainLayout;
