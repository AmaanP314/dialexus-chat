"use client";

import React, { useMemo, useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import CreateUser from "./CreateUser";
import DeactivateUser from "./DeactivateUser";
import ReactivateUser from "./ReactivateUser";
import ResetPassword from "./ResetPassword";
import { AdminViewUser } from "../types";

interface UserManagementProps {
  activeSubTab: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ activeSubTab }) => {
  const { stats, isLoading } = useDashboard();
  // State for the success message is now managed here
  const [successData, setSuccessData] = useState<{
    user: AdminViewUser;
    pass: string;
  } | null>(null);

  const activeUsers = useMemo(() => {
    if (!stats) return [];
    const deactivatedIds = new Set(stats.deactivatedUsers.map((u) => u.id));
    return stats.totalUsers.filter((u) => !deactivatedIds.has(u.id));
  }, [stats]);

  // When the sub-tab changes, clear any previous success messages
  React.useEffect(() => {
    setSuccessData(null);
  }, [activeSubTab]);

  if (isLoading && !stats) {
    return <div className="p-4 text-center">Loading user data...</div>;
  }

  if (!stats) {
    return <div className="p-4 text-center">No user data available.</div>;
  }

  // The switch statement now correctly uses the prop
  switch (activeSubTab) {
    case "createUser":
      return (
        <CreateUser
          allUsers={stats.totalUsers}
          setSuccessData={setSuccessData}
          successData={successData}
        />
      );
    case "deactivateUser":
      return <DeactivateUser activeUsers={activeUsers} />;
    case "reactivateUser":
      return <ReactivateUser deactivatedUsers={stats.deactivatedUsers} />;
    case "resetPassword":
      return <ResetPassword allUsers={stats.totalUsers} />;
    default:
      return (
        <div className="text-center text-muted-foreground mt-8">
          Select an option from the user management menu.
        </div>
      );
  }
};

export default UserManagement;
