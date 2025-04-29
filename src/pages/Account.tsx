
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogOut, Settings, User } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Account: React.FC = () => {
  const { userData, isAuthenticated, signOut } = useFirebaseAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const handleLogout = () => {
    signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully."
    });
  };
  
  const handleEditProfile = () => {
    navigate('/profile');
  };
  
  if (!userData) {
    return null; // Will redirect via the useEffect
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your personal information and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userData.avatarUrl || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {getInitials(userData.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{userData.name}</h3>
                <p className="text-muted-foreground">{userData.email}</p>
                {userData.phone && <p className="text-muted-foreground">{userData.phone}</p>}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="capitalize">{userData.role}</p>
                </div>
                {userData.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p>{userData.address}</p>
                  </div>
                )}
                {userData.specialization && (
                  <div>
                    <p className="text-sm text-muted-foreground">Specialization</p>
                    <p>{userData.specialization}</p>
                  </div>
                )}
                {userData.governmentId?.type && (
                  <div>
                    <p className="text-sm text-muted-foreground">ID Type</p>
                    <p className="capitalize">{userData.governmentId.type}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleEditProfile}
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Logout
            </CardTitle>
            <CardDescription>
              Sign out of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You'll need to sign back in if you want to access your account.</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Account;
