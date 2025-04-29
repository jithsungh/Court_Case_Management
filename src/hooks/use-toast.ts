
// Import from the UI toast components
import { CustomToastProps, ToastActionElement } from "@/components/ui/toast";
import { useContext } from "react";
import { ToastContext } from "@/components/ui/toast-provider";

export type ToastVariant = "default" | "destructive";

export type ToastOptions = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
};

// Custom hook to use the toast context
export const useToast = (): {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
  toasts: CustomToastProps[];
} => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
};

// Direct toast function - standalone function that doesn't rely on hook
export const toast = (options: ToastOptions) => {
  // Get the toast function from the context directly
  const context = useContext(ToastContext);
  if (!context) {
    console.error("Toast was called outside of ToastProvider context");
    return;
  }
  return context.toast(options);
};
