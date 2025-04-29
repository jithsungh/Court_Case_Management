import { useState } from "react";
import FirebaseDataProviderComponent from "./context/FirebaseDataContext";
import { FirebaseAuthContext } from "./context/FirebaseAuthContext.tsx";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import Cases from "./pages/Cases";
import Schedule from "./pages/Schedule";
import Messages from "./pages/Messages";
import Docket from "./pages/Docket";
import NewCases from "./pages/NewCases";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import CaseDetails from "./pages/CaseDetails";
import CaseSummary from "./pages/CaseSummary";
import CaseRequests from "./pages/CaseRequests";
import DefenseRequests from "./pages/DefenseRequests";
import FileCasePage from "./pages/FileCasePage";
import FindLawyer from "./pages/FindLawyer";
import FindCasesAgainstMe from "./pages/FindCasesAgainstMe";
import Hearings from "./pages/Hearings";
import ProfileEdit from "./pages/ProfileEdit";
import Account from "./pages/Account";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import Faq from "./pages/Faq";
import HelpCenter from "./pages/HelpCenter";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import GdprCompliance from "./pages/GdprCompliance";
import Documentation from "./pages/Documentation";
import UserGuides from "./pages/UserGuides";
import { useFirebaseAuth } from "./context/FirebaseAuthContext";
import { FirebaseInit } from "./firebase/components/FirebaseInit";
import { Toaster } from "./components/ui/toaster";
import { DefenseCaseList } from "./components/cases/DefenseCaseList";
import Register from "./pages/Register";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();

  const authenticated = !!firebaseUser;

  if (firebaseLoading || !isInitialized) {
    return (
      <>
        <FirebaseInit onComplete={() => setIsInitialized(true)} />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <FirebaseDataProviderComponent>
        <ScrollToTop />
        <Routes>
          <Route path="/login/*" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {!authenticated ? (
            <>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/features" element={<Features />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/help-center" element={<HelpCenter />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/user-guides" element={<UserGuides />} />
              <Route path="/terms-of-use" element={<TermsOfService />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/gdpr-compliance" element={<GdprCompliance />} />
              <Route path="*" element={<Login />} />
            </>
          ) : (
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/defense-cases" element={<DefenseCaseList />} />
              <Route path="/defense-requests" element={<DefenseRequests />} />
              <Route path="/cases/:id" element={<CaseDetails />} />
              <Route path="/case-summary/:id" element={<CaseSummary />} />
              <Route path="/cases/:id/summary" element={<CaseSummary />} />
              <Route path="/case-summary" element={<CaseSummary />} />
              <Route path="/case-requests" element={<CaseRequests />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/hearings" element={<Hearings />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/docket" element={<Docket />} />
              <Route path="/new-cases" element={<NewCases />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/file-case" element={<FileCasePage />} />
              <Route path="/find-lawyer" element={<FindLawyer />} />
              <Route
                path="/find-cases-against-me"
                element={<FindCasesAgainstMe />}
              />
              <Route path="/profile" element={<ProfileEdit />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          )}
        </Routes>
        <Toaster />
      </FirebaseDataProviderComponent>
    </>
  );
}

export default App;
