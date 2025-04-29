import {
  useFirebaseAuth
} from "@/context/FirebaseAuthContext.tsx";
import {
  Navigate,
  useLocation,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  Gavel,
  User,
  UserCog,
  Scale,
  PenLine,
  Info,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { UserRole } from "@/services/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ErrorBoundary from "@/components/ErrorBoundary";

const RoleIcon = ({
  role,
  showDropdown = false,
}: {
  role: UserRole;
  showDropdown?: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname.includes("signup");
  const path = isSignUp ? "/login/signup?role=" : "/login/?role=";

  let Icon, color;

  switch (role) {
    case "client":
      Icon = User;
      color = "text-blue-500";
      break;
    case "lawyer":
      Icon = Scale;
      color = "text-green-500";
      break;
    case "clerk":
      Icon = UserCog;
      color = "text-purple-500";
      break;
    case "judge":
      Icon = Gavel;
      color = "text-red-500";
      break;
    default:
      Icon = User;
      color = "text-blue-500";
  }

  if (!showDropdown) {
    return <Icon className={`h-10 w-10 ${color}`} />;
  }

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer relative group">
                <Icon className={`h-10 w-10 ${color}`} />
                <div className="absolute -right-1 -bottom-1 bg-gray-100 rounded-full p-0.5 border border-gray-200 shadow-sm group-hover:bg-gray-200 transition-colors">
                  <PenLine className="h-3.5 w-3.5 text-gray-600" />
                </div>
              </div>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change role</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={() => navigate(`${isSignUp ? "/login/signup?role=client" : "/login?role=client"}`, { replace: true })}>
        <User className="h-4 w-4 text-blue-500 mr-2" /> Client
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`${isSignUp ? "/login/signup?role=lawyer" : "/login?role=lawyer"}`, { replace: true })}>
        <Scale className="h-4 w-4 text-green-500 mr-2" /> Lawyer
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`${isSignUp ? "/login/signup?role=clerk" : "/login?role=clerk"}`, { replace: true })}>
        <UserCog className="h-4 w-4 text-purple-500 mr-2" /> Clerk
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`${isSignUp ? "/login/signup?role=judge" : "/login?role=judge"}`, { replace: true })}>
        <Gavel className="h-4 w-4 text-red-500 mr-2" /> Judge
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getRoleTitle = (role: UserRole) => {
  switch (role) {
    case "client":
      return "Client";
    case "lawyer":
      return "Lawyer";
    case "clerk":
      return "Clerk";
    case "judge":
      return "Judge";
    default:
      return "Client";
  }
};

const Login = () => {
  const { user, loading } = useFirebaseAuth();
  const [showAnimation, setShowAnimation] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignUp = location.pathname.includes("signup");

  const isValidUserRole = (role: string | null): role is UserRole => {
    return role === "client" || role === "lawyer" || role === "clerk" || role === "judge";
  };

  let queryRole = searchParams.get("role");

  const pathRole = location.pathname.split('/').pop();
  if (pathRole && isValidUserRole(pathRole) && !queryRole) {
    console.log(`Login: Detected role from path: ${pathRole}`);
    queryRole = pathRole;
    
    if (!searchParams.has("role")) {
      navigate(`${isSignUp ? "/login/signup" : "/login"}?role=${pathRole}`, { replace: true });
    }
  }

  let defaultRole: UserRole = isValidUserRole(queryRole) ? queryRole : "lawyer";
  console.log(`Login: Using role: ${defaultRole} (from ${queryRole ? 'query/path' : 'default'})`);

  useEffect(() => {
    setShowAnimation(true);
  }, []);

  const safeRole = useMemo(() => defaultRole, [defaultRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-court-gray to-court-blue/10 p-4">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center text-court-blue hover:underline"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
      </Link>

      <div
        className={"hidden md:flex flex-col items-center md:items-start space-y-8 md:w-1/2 p-8 transition-all duration-700 ease-in-out " + (
          showAnimation
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-10"
        )}
      >
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-court-blue flex items-center justify-center">
            <Gavel className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-court-blue">CourtWise</h1>
            <p className="text-muted-foreground">
              Court Case Management System
            </p>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-3 text-court-blue-dark">
            Justice Made Efficient
          </h2>
          <p className="text-muted-foreground mb-6">
            CourtWise helps streamline court case management, connecting
            clients, lawyers, clerks, and judges in one seamless platform.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-court-blue hover:underline font-medium text-sm flex items-center">
                <Info className="h-4 w-4 mr-1" /> How to use CourtWise
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Getting Started with CourtWise
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h3 className="font-semibold text-blue-700">Clients</h3>
                        <p className="text-sm mt-1">
                          Find lawyers and track your case progress
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <h3 className="font-semibold text-green-700">
                          Lawyers
                        </h3>
                        <p className="text-sm mt-1">
                          Manage cases and communicate with courts
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3">
                        <h3 className="font-semibold text-purple-700">
                          Officials
                        </h3>
                        <p className="text-sm mt-1">
                          Schedule hearings and process filings
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Sign up with your details, complete your profile, and
                      start using features specific to your role.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div
        className={"md:w-1/2 w-full flex flex-col items-center justify-center transition-all duration-700 ease-in-out " + (
          showAnimation
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10"
        )}
      >
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-court-blue flex items-center justify-center">
              <Gavel className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">CourtWise</h1>
          <p className="text-muted-foreground">Court Case Management System</p>
        </div>

        {isSignUp ? (
          <ErrorBoundary path={location.pathname}>
            <SignUpForm key={safeRole} defaultRole={safeRole} path={location.pathname} />
          </ErrorBoundary>
        ) : (
          <SignInForm role={safeRole} />
        )}
      </div>
    </div>
  );
};

export default Login;
