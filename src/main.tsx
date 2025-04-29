
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ToastProvider } from "./components/ui/toast-provider";
import { FirebaseAuthProvider } from "./context/FirebaseAuthContext";
import { BrowserRouter } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext"; // Add import for AuthProvider

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ToastProvider>
      <FirebaseAuthProvider>
        <AuthProvider> {/* Add AuthProvider here */}
          <DataProvider>
            <App />
          </DataProvider>
        </AuthProvider>
      </FirebaseAuthProvider>
    </ToastProvider>
  </BrowserRouter>
);
