
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Bookmark, User, LogOut } from 'lucide-react';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NavBar: React.FC = () => {
  const location = useLocation();
  const { userData, isAuthenticated, signOut } = useFirebaseAuth();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const navItems = [
    { label: 'Feed', path: '/', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Saved', path: '/saved', icon: Bookmark },
    { label: 'Account', path: '/account', icon: User },
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto border-t md:border-t-0 md:border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="hidden md:block">
          <Link to="/" className="text-2xl font-bold text-primary">
            CourtWise
          </Link>
        </div>
        
        <div className="flex justify-around w-full md:w-auto md:justify-center md:gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className={`flex flex-col md:flex-row items-center gap-1 px-1 md:px-4 py-1 rounded-full transition-all duration-300 ${
                  isActive(item.path) 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] md:text-sm md:ml-2">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
        
        <div className="hidden md:block">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full" size="sm">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userData ? getInitials(userData.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 hidden lg:inline-block">{userData?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
