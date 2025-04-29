
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import NavBar from './NavBar';
import Footer from './Footer';
import { cn } from '@/lib/utils';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  const { isAuthenticated } = useFirebaseAuth();
  const { userData, user } = useFirebaseAuth();
  
  // This effect can help debug user data issues
  useEffect(() => {
    if (user && userData) {
      console.log("Layout: Current user data:", userData);
      
      // Check if we're showing "Unknown User"
      if (userData.name === "Unknown User") {
        console.warn("Layout: User name is 'Unknown User'. User data may not be properly loaded.");
        
        // Log localStorage data for debugging
        const storedUser = localStorage.getItem("courtwise_user");
        if (storedUser) {
          console.log("Layout: Found user data in localStorage:", storedUser);
        } else {
          console.warn("Layout: No user data found in localStorage");
        }
      }
    }
  }, [userData, user]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className={cn(
        "container mx-auto px-4 pt-4 pb-20 md:pt-20 md:pb-8 flex-grow animate-fade-in",
        className
      )}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
};

export default Layout;
