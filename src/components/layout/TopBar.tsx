
import React from 'react';
import { Button } from '@/components/ui/button';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Menu, Bell, User } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar }) => {
  const { userData, user } = useFirebaseAuth();

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b bg-background">
      <div className="flex items-center space-x-4">
        {onToggleSidebar && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu />
          </Button>
        )}
        <h1 className="text-xl font-semibold">
          {userData?.role ? `${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} Dashboard` : 'Dashboard'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon">
          <User />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
