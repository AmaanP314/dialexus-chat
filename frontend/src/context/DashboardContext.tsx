"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { OverviewStats, AdminViewUser } from "@/components/types";
import { useAuth } from "./AuthContext";
import {
  getAdminAllUsers,
  getAdminOnlineUsers,
  getAdminDeactivatedUsers,
  getAdminAllGroups,
  getAdminDeactivatedGroups,
} from "@/lib/api";

interface DashboardContextType {
  stats: OverviewStats | null;
  isLoading: boolean;
  // New granular update functions
  addNewUserToCache: (newUser: AdminViewUser) => void;
  refetchUserLists: () => Promise<void>;
  refetchGroupLists: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const fetchInitialStats = useCallback(async () => {
    if (isLoading || stats) return;
    setIsLoading(true);
    try {
      const [
        totalUsers,
        onlineUsers,
        deactivatedUsers,
        totalGroups,
        deactivatedGroups,
      ] = await Promise.all([
        getAdminAllUsers(),
        getAdminOnlineUsers(),
        getAdminDeactivatedUsers(),
        getAdminAllGroups(),
        getAdminDeactivatedGroups(),
      ]);
      setStats({
        totalUsers,
        onlineUsers,
        deactivatedUsers,
        totalGroups,
        deactivatedGroups,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, stats]);

  // --- NEW: Granular Caching Logic ---

  // Adds a newly created user to the cache without a full refetch
  const addNewUserToCache = (newUser: AdminViewUser) => {
    setStats((prevStats) => {
      if (!prevStats) return null;
      return {
        ...prevStats,
        totalUsers: [newUser, ...prevStats.totalUsers],
      };
    });
  };

  // Refetches only the user-related lists, not groups
  const refetchUserLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const [totalUsers, onlineUsers, deactivatedUsers] = await Promise.all([
        getAdminAllUsers(),
        getAdminOnlineUsers(),
        getAdminDeactivatedUsers(),
      ]);
      setStats((prevStats) => ({
        ...prevStats!,
        totalUsers,
        onlineUsers,
        deactivatedUsers,
      }));
    } catch (error) {
      console.error("Failed to refetch user lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const refetchGroupLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const [totalGroups, deactivatedGroups] = await Promise.all([
        getAdminAllGroups(),
        getAdminDeactivatedGroups(),
      ]);
      setStats((prevStats) => ({
        ...prevStats!,
        totalGroups,
        deactivatedGroups,
      }));
    } catch (error) {
      console.error("Failed to refetch group lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && !stats) {
      fetchInitialStats();
    }
  }, [user, stats, fetchInitialStats]);

  return (
    <DashboardContext.Provider
      value={{
        stats,
        isLoading,
        addNewUserToCache,
        refetchUserLists,
        refetchGroupLists,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined)
    throw new Error("useDashboard must be used within a DashboardProvider");
  return context;
};
