import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as FirebaseUser } from "firebase/auth"; // Explicitly import and alias Firebase User type
import { User, UserRole } from "@/services/types"; // Your custom User type
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signOut as firebaseSignOut,
  getCurrentUser, // Assuming this fetches Firestore data (returning custom User type)
  onAuthChange, // Firebase Auth state listener (returning FirebaseUser type)
  createMissingUserDocuments, // Import the new function
  getUserCollectionName, // Import to get the correct collection name
} from "@/firebase/services/authService";
import { useToast } from "@/hooks/use-toast";

// Define the shape of the context value
interface AuthContextType {
  user: FirebaseUser | null; // State holds the raw Firebase Auth user object
  userData: User | null; // State holds your application-specific user data from Firestore
  loading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean; // Added for compatibility
  error: string | null;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    additionalData?: Record<string, any>
  ) => Promise<void>;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// Create the context
export const FirebaseAuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Create the provider component
export const FirebaseAuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null); // State for Firebase Auth user
  const [userData, setUserData] = useState<User | null>(null); // State for Firestore user data
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null); // Add userRole state
  const { toast } = useToast();

  // Effect to subscribe to Firebase Auth state changes
  useEffect(() => {
    console.log("FirebaseAuthContext: Setting up onAuthChange listener.");
    setLoading(true);

    // Subscribe to the auth state change. The callback receives FirebaseUser | null.
    const unsubscribe = onAuthChange(async (authUser: FirebaseUser | null) => {
      console.log(
        "FirebaseAuthContext: onAuthChange triggered with:",
        authUser
      );
      setUser(authUser);
      console.log("FirebaseAuthContext: firebaseUser set to:", authUser);

      if (authUser) {
        console.log(
          "FirebaseAuthContext: User authenticated, fetching Firestore data for UID:",
          authUser.uid
        );
        try {
          // ROLE HANDLING: Get the stored user data first to determine the role
          let storedRole: UserRole | null = null;
          const storedUserJSON = localStorage.getItem("courtwise_user");
          
          if (storedUserJSON) {
            try {
              const storedUser = JSON.parse(storedUserJSON);
              if (storedUser && storedUser.role) {
                console.log("FirebaseAuthContext: Found stored role in localStorage:", storedUser.role);
                storedRole = storedUser.role as UserRole;
              }
            } catch (e) {
              console.error("Error parsing stored user:", e);
            }
          }
          
          // If we have a stored role in context state, prioritize it over localStorage
          const roleToUse = userRole || storedRole;
          console.log("FirebaseAuthContext: Using role for data fetching:", roleToUse || "null (will auto-detect)");

          // Get user data from Firestore with the determined role
          const fetchedUserData: User | null = await getCurrentUser(roleToUse);
          console.log(
            "FirebaseAuthContext: Firestore data fetched:",
            fetchedUserData
          );

          if (fetchedUserData) {
            // Fix: Ensure name is preserved
            if (!fetchedUserData.name && authUser.displayName) {
              fetchedUserData.name = authUser.displayName;
            } else if (!fetchedUserData.name && authUser.email) {
              fetchedUserData.name = authUser.email.split('@')[0]; // Use email prefix as name
            }
            
            // CRITICAL: Double check roles consistency
            if (!fetchedUserData.role) {
              console.error("FirebaseAuthContext: User has no role!");
              throw new Error("User role could not be determined");
            }
            
            // CRITICAL FIX: Set the role from the fetched data first
            console.log("FirebaseAuthContext: Setting userRole to:", fetchedUserData.role);
            setUserRole(fetchedUserData.role);
            setUserData(fetchedUserData);
            
            // Store complete user data including role
            localStorage.setItem("courtwise_user", JSON.stringify({
              ...fetchedUserData,
              version: 1,
              uid: authUser.uid,
              id: authUser.uid,
              email: authUser.email,
              role: fetchedUserData.role, // Make sure role is explicitly set
              name: fetchedUserData.name || authUser.displayName || authUser.email?.split('@')[0] || "User"
            }));
            
            setError(null);
            toast({
              title: "Authenticated",
              description: `Welcome ${fetchedUserData.name || authUser.displayName || fetchedUserData.email?.split('@')[0] || "back"}!`,
            });
            setIsInitialized(true);
            setLoading(false);
          } else {
            console.warn(
              "FirebaseAuthContext: Auth user found but no corresponding Firestore data."
            );
            
            // Only attempt to restore user if we have a definitive role to use
            if (roleToUse) {
              console.log(`FirebaseAuthContext: Attempting to create user with definitive role: ${roleToUse}`);
              
              const success = await createMissingUserDocuments(authUser, roleToUse);
              
              if (success) {
                // Retry fetching user data after creating documents
                const retryUserData = await getCurrentUser(roleToUse);
                if (retryUserData) {
                  console.log("FirebaseAuthContext: User data after restoration:", retryUserData);
                  console.log("FirebaseAuthContext: User role after restoration:", retryUserData.role);
                  
                  // Update the userRole state with the detected/created role
                  setUserRole(retryUserData.role);
                  setUserData(retryUserData);
                  
                  localStorage.setItem("courtwise_user", JSON.stringify({
                    ...retryUserData,
                    version: 1,
                    uid: authUser.uid,
                    id: authUser.uid,
                    email: authUser.email,
                    role: retryUserData.role // Explicitly set role
                  }));
                  
                  setError(null);
                  toast({
                    title: "Profile Restored",
                    description: "Your profile has been restored successfully.",
                  });
                  setIsInitialized(true);
                  setLoading(false);
                  return;
                }
              }
            }
            
            // If we get here, we failed to restore the user
            handleAuthError("User profile data not found or could not be restored. Please sign out and sign in again with your correct role.");
          }
        } catch (fetchError) {
          console.error(
            "FirebaseAuthContext: Error fetching user data:",
            fetchError
          );
          handleAuthError(
            fetchError instanceof Error
              ? fetchError.message
              : "Failed to fetch user data"
          );
        }
      } else {
        console.log("FirebaseAuthContext: User logged out.");
        setUser(null);
        setUserData(null);
        setUserRole(null); // Clear userRole state
        setError(null);
        localStorage.removeItem("courtwise_user");
        setLoading(false);
        setIsInitialized(false);
        console.log("FirebaseAuthContext: setLoading(false) after logout.");
      }
    });

    // Cleanup function
    return () => {
      console.log("FirebaseAuthContext: Cleaning up onAuthChange listener.");
      unsubscribe();
    };
  }, []);

  // Helper to handle auth errors consistently
  const handleAuthError = (errorMessage: string) => {
    setUserData(null);
    setError(errorMessage);
    setLoading(false);
    toast({
      title: "Authentication Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Sign up function - update to handle the role correctly
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    additionalData?: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);
    console.log("FirebaseAuthContext: setLoading(true) before signup");
    console.log(`FirebaseAuthContext: Signing up with role: ${role}`);

    try {
      // CRITICAL FIX: Set userRole state before calling firebaseSignUp
      setUserRole(role);
      console.log(`FirebaseAuthContext: Setting userRole state to ${role} before signup`);
      
      const userData = await firebaseSignUp(email, password, name, role, additionalData);
      
      if (userData) {
        // Set userData immediately to prevent loading state issues
        setUserData(userData);
        
        // Update the user role in state
        setUserRole(role);
        
        // Store the user data in localStorage
        localStorage.setItem("courtwise_user", JSON.stringify({
          ...userData,
          version: 1,
          role: role, // Explicitly set the role
        }));
      }
      
      console.log(
        "Signup successful via auth service. Listener will handle state updates.",
        userData
      );
      
      toast({
        title: "Account created",
        description: `Welcome to CourtWise, ${name}!`,
        variant: "default",
      });
      
      // Don't set loading false here as the auth listener will do that
    } catch (error) {
      console.error("Sign up error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";
      setError(errorMessage);
      setLoading(false); // Stop loading on error
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    console.log("FirebaseAuthContext: setLoading(true) before signin");
    console.log(`FirebaseAuthContext: Signing in with role: ${role}`);

    try {
      // CRITICAL: Clear any existing user data first to prevent role confusion
      setUserData(null);
      
      // Store the attempted role in state before authentication
      setUserRole(role);
      console.log(`FirebaseAuthContext: Setting userRole state to ${role} before signin`);
      
      // Use the updated signIn that enforces role validation
      const user = await firebaseSignIn(email, password, role);
      console.log(
        "Sign in successful via auth service. User data:", user
      );
      
      // Auth listener will handle state updates, but we can immediately set userData
      // to prevent flicker
      if (user) {
        setUserData(user);
        
        // Verify the role matches what was requested
        console.log("FirebaseAuthContext: User role from sign-in:", user.role);
        
        if (user.role !== role) {
          console.error(`Role mismatch: requested ${role}, got ${user.role}`);
          throw new Error(`Invalid role. Expected ${role}, got ${user.role}`);
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign in";
      setError(errorMessage);
      setUser(null); // Clear auth user on failed sign-in attempt
      setUserData(null); // Clear user data on failed sign-in attempt
      setUserRole(null); // Clear role on failed sign-in attempt
      setLoading(false); // Stop loading on error
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error; // Rethrow for handling in components
    }
  };

  // Sign out function
  const signOut = async () => {
    setError(null);
    console.log("FirebaseAuthContext: Attempting sign out.");
    try {
      await firebaseSignOut();
      setUserRole(null); // Clear role on sign out
      setUserData(null); // Immediately clear user data
      console.log("FirebaseAuthContext: firebaseSignOut called successfully.");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
        variant: "default",
      });
      // Listener will handle state clearing
    } catch (error) {
      console.error("Sign out error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to sign out";
      setError(errorMessage);
      toast({
        title: "Sign Out Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Function to clear the error state manually
  const clearError = () => {
    setError(null);
  };

  // Assemble the context value
  const contextValue: AuthContextType = {
    user,
    userData,
    loading,
    isInitialized,
    isAuthenticated: !!userData, // Add this property
    error,
    signUp,
    signIn,
    signOut,
    clearError,
  };

  // Return the provider
  return (
    <FirebaseAuthContext.Provider value={contextValue}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

// Custom hook to consume the context - Ensure this is exported
export const useFirebaseAuth = (): AuthContextType => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error(
      "useFirebaseAuth must be used within a FirebaseAuthProvider"
    );
  }
  return context;
};
