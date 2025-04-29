import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserRole } from "@/services/types";
import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Gavel, User, UserCog, Scale, PenLine } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Role icon component
const RoleIcon = ({ role, showDropdown = false }: { role: UserRole, showDropdown?: boolean }) => {
  const navigate = useNavigate();
  
  let Icon, color;
  
  switch (role) {
    case 'client':
      Icon = User;
      color = "text-blue-500";
      break;
    case 'lawyer':
      Icon = Scale;
      color = "text-green-500";
      break;
    case 'clerk':
      Icon = UserCog;
      color = "text-purple-500";
      break;
    case 'judge':
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
        <DropdownMenuItem onClick={() => navigate(`/login?role=client`)}>
          <User className="h-4 w-4 text-blue-500 mr-2" /> Client
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/login?role=lawyer`)}>
          <Scale className="h-4 w-4 text-green-500 mr-2" /> Lawyer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/login?role=clerk`)}>
          <UserCog className="h-4 w-4 text-purple-500 mr-2" /> Clerk
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/login?role=judge`)}>
          <Gavel className="h-4 w-4 text-red-500 mr-2" /> Judge
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getRoleTitle = (role: UserRole) => {
  switch (role) {
    case 'client': return "Client";
    case 'lawyer': return "Lawyer";
    case 'clerk': return "Clerk";
    case 'judge': return "Judge";
    default: return "Client";
  }
};

interface SignInFormProps {
  role: UserRole;
}

export const SignInForm = ({ role }: SignInFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, error: authError, loading, userData, user } = useFirebaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  // Check if user is already logged in
  useEffect(() => {
    if (userData && !loading) {
      console.log("SignInForm: User already logged in, redirecting to dashboard");
      console.log("SignInForm: User role:", userData.role);
      navigate("/dashboard");
    }
  }, [userData, loading, navigate]);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    
    console.log(`SignInForm: Attempting login with role: ${role}`);
    
    try {
      // Pass the role explicitly to ensure correct collection is used
      await signIn(data.email, data.password, role);
      
      // signIn will throw if there's a role mismatch, so if we get here, login succeeded
      console.log("Login successful, user role:", role);
      navigate("/dashboard");
      toast({
        title: "Login successful",
        description: `You have logged in as a ${getRoleTitle(role)}`,
      });
    } catch (err) {
      console.error("Login error:", err);
      
      // Don't clear the form on error
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "An error occurred during login",
        variant: "destructive",
      });
    }
    finally {
      setIsLoading(false);
    }
  };

  const getSuggestionMessage = () => {
    return `For demo: Use "${role}@example.com" with password "password"`;
  };

  return (
    <Card className="w-full max-w-md shadow-lg animate-fadeIn">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <div className="p-3 rounded-full bg-court-gray flex items-center justify-center">
            <RoleIcon role={role} showDropdown={true} />
          </div>
        </div>
        <CardTitle className="text-2xl">{getRoleTitle(role)} Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your {getRoleTitle(role).toLowerCase()} account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={`${role}@example.com`}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-xs text-muted-foreground text-center">
              {getSuggestionMessage()}
            </p>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : `Sign in as ${getRoleTitle(role)}`}
            </Button>
            
            <div className="text-sm text-center space-y-2">
              <p>
                Don't have an account?{" "}
                <Link
                  to={`/login/signup?role=${role}`}
                  className="text-court-blue hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
              
              <p className="text-xs text-muted-foreground">
                By logging in, you agree to our{" "}
                <Link to="/terms-of-service" className="hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy-policy" className="hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
