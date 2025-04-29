
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useFirebaseAuth } from "@/context/FirebaseAuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, and } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

export function DashboardStats() {
  const firebaseAuth = useFirebaseAuth(); // Use FirebaseAuth as fallback
  const auth = useAuth(); // This will throw if AuthProvider is not available
  
  // Use Firebase auth data if AuthContext is not available
  const currentUser = auth.currentUser || firebaseAuth.user;
  const userData = auth.userData || firebaseAuth.userData;
  
  const [activeCases, setActiveCases] = useState(0);
  const [totalCases, setTotalCases] = useState(0);
  const [upcomingHearings, setUpcomingHearings] = useState(0);
  const [pendingActions, setPendingActions] = useState(0); // Replace mock data

  useEffect(() => {
    const fetchData = async () => {
      // This check is technically redundant due to the outer if, but good practice
      if (!currentUser || !userData) return;

      let casesQuery = query(collection(db, "cases"));
      // Use userData safely as it's guaranteed to exist here by the outer check
      if (userData.role === 'client') {
        casesQuery = query(collection(db, "cases"), where("clientId", "==", currentUser.uid));
      } else if (userData.role === 'lawyer') {
        casesQuery = query(collection(db, "cases"), where("lawyerId", "==", currentUser.uid));
      } // Clerks and judges see all cases by default

      const casesSnapshot = await getDocs(casesQuery);
      const userCases = casesSnapshot.docs.map(doc => doc.data());

      const activeCasesCount = userCases.filter(
        (c: any) => c.status !== "closed" && c.status !== "dismissed"
      ).length;

      setTotalCases(userCases.length);
      setActiveCases(activeCasesCount);

      // Fetch upcoming hearings (simplified for now - needs proper date handling)
      const hearingsQuery = query(collection(db, "hearings"));
      const hearingsSnapshot = await getDocs(hearingsQuery);
      const allHearings = hearingsSnapshot.docs.map(doc => doc.data());

      const upcomingHearingsCount = allHearings.filter(
         (h: any) => userCases.some((c: any) => c.id === h.caseId) &&
           h.status === "scheduled" &&
           typeof h.date === 'string' &&
           new Date(h.date) > new Date()
       ).length;
      setUpcomingHearings(upcomingHearingsCount);

      // Fetch pending actions from Firestore
      const actionsQuery = query(
        collection(db, "actions"),
        where("userId", "==", currentUser.uid) // Safe: currentUser exists here
      );
      const actionsSnapshot = await getDocs(actionsQuery);
      const pendingActionsCount = actionsSnapshot.docs.length;
      setPendingActions(pendingActionsCount);
    };

    // Only run fetch if data is available
    if (currentUser && userData) {
      fetchData();
    } else {
      // Reset state if user/data is not available (e.g., logout)
      setActiveCases(0);
      setTotalCases(0);
      setUpcomingHearings(0);
      setPendingActions(0);
    }
  }, [currentUser?.uid, userData?.role]); // Depend on specific primitive values

  // Data for doughnut chart
  const chartData = {
    labels: ['Active Cases', 'Closed Cases', 'Upcoming Hearings', 'Pending Actions'],
    datasets: [
      {
        data: [activeCases, totalCases - activeCases, upcomingHearings, pendingActions],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(16, 185, 129, 0.8)', // green
          'rgba(245, 158, 11, 0.8)', // amber
          'rgba(239, 68, 68, 0.8)',  // red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
    cutout: '65%',
    responsive: true,
    maintainAspectRatio: false,
  };

  // Conditional rendering: Show loading or the card
  if (!currentUser || !userData) {
    // Return loading state or null if data isn't ready
    return <div className="p-4 text-center text-muted-foreground">Loading dashboard stats...</div>;
  }

  // Render the actual component content only if data is ready
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Case Summary</CardTitle>
            <CardDescription>Overview of your current workload</CardDescription>
          </div>
          <Avatar className="h-12 w-12">
            {/* Add optional chaining for safety, though the outer check should suffice */}
            <AvatarImage src={userData?.avatarUrl} alt={userData?.name ?? 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
               {userData?.name?.substring(0, 2).toUpperCase() ?? '??'}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48">
            <Doughnut data={chartData} options={options} />
          </div>
          <div className="flex flex-col justify-center space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                <span>Active Cases</span>
              </div>
              <span className="font-bold">{activeCases}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span>Closed Cases</span>
              </div>
              <span className="font-bold">{totalCases - activeCases}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-amber-500 mr-2"></div>
                <span>Upcoming Hearings</span>
              </div>
              <span className="font-bold">{upcomingHearings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                <span>Pending Actions</span>
              </div>
              <span className="font-bold">{pendingActions}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
