
// This file should just re-export from the hooks directory
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
import type { ToastOptions, ToastVariant } from "@/hooks/use-toast";

export { useToast, toast, type ToastOptions, type ToastVariant };
