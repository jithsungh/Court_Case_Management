
import React, { createContext, useEffect, useState } from "react";
import { ToastViewport, Toast, ToastClose, ToastTitle, ToastDescription, ToastProvider as RadixToastProvider } from "./toast";

// Define the type for toast items
export interface CustomToastProps {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

// Define the context type
interface ToastContextType {
  toast: (options: Omit<CustomToastProps, "id">) => void;
  dismiss: (id: string) => void;
  toasts: CustomToastProps[];
}

// Create the context
export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);

// Create the provider component
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State to store toast items
  const [toasts, setToasts] = useState<CustomToastProps[]>([]);

  // Function to add a toast
  const toast = ({
    title,
    description,
    action,
    variant = "default",
    duration = 5000,
  }: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    variant?: "default" | "destructive";
    duration?: number;
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Log toast creation
    console.log("Creating toast with ID:", id, { title, description, variant });
    
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, action, variant, duration },
    ]);
    
    // Auto dismiss after duration
    if (duration !== Infinity) {
      setTimeout(() => {
        console.log("Auto-dismissing toast with ID:", id);
        dismiss(id);
      }, duration);
    }
  };

  // Function to dismiss a toast
  const dismiss = (id: string) => {
    console.log("Dismissing toast with ID:", id);
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // Context value
  const contextValue: ToastContextType = {
    toast,
    dismiss,
    toasts,
  };

  // Render the provider
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};
