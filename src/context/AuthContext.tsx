import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserRole } from '@/services/types';
import { useFirebaseAuth } from './FirebaseAuthContext';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signup: (email: string, password: string, userData: any) => Promise<{ user?: User, error?: Error }>;
  login: (email: string, password: string, role: UserRole) => Promise<{ user?: User, error?: Error }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const firebaseAuth = useFirebaseAuth();
  
  const signup = async (email: string, password: string, userData: any) => {
    try {
      await firebaseAuth.signUp(email, password, userData.name, userData.role as UserRole, userData);
      return { user: firebaseAuth.userData };
    } catch (error) {
      console.error("AuthContext signup error:", error);
      return { error: error as Error };
    }
  };
  
  const login = async (email: string, password: string, role: UserRole) => {
    try {
      await firebaseAuth.signIn(email, password, role);
      return { user: firebaseAuth.userData };
    } catch (error) {
      console.error("AuthContext login error:", error);
      return { error: error as Error };
    }
  };
  
  const logout = async () => {
    await firebaseAuth.signOut();
  };
  
  const updateProfile = async (data: Partial<User>) => {
    console.log("Profile update requested with data:", data);
    // Implement profile update logic with Firestore
  };
  
  const value: AuthContextType = {
    currentUser: firebaseAuth.user,
    userData: firebaseAuth.userData,
    loading: firebaseAuth.loading,
    isAuthenticated: firebaseAuth.isAuthenticated,
    signup,
    login,
    logout,
    updateProfile,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
