
import React from 'react';
import { useFirebaseAuth } from '@/context/FirebaseAuthContext';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DefendantCaseAlerts } from '@/components/dashboard/DefendantCaseAlerts';
import { RecentCases } from '@/components/dashboard/RecentCases';
import { RecentMessages } from '@/components/dashboard/RecentMessages';
import { UpcomingHearings } from '@/components/dashboard/UpcomingHearings';
import ClerkCaseList from '@/components/cases/ClerkCaseList';

const Dashboard = () => {
  const { userData } = useFirebaseAuth();

  if (userData?.role === 'clerk') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Clerk Dashboard</h1>
        <DashboardStats />
        <ClerkCaseList />
      </div>
    );
  }

  // Return existing dashboard layout for other roles
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <DashboardStats />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <RecentCases />
          <DefendantCaseAlerts />
        </div>
        <div className="space-y-6">
          <UpcomingHearings />
          <RecentMessages />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
