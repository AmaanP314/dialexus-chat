"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { OverviewStats } from "../types";
import {
  KeyRound,
  Users,
  Wifi,
  UserX,
  MessageCircle,
  CircleSlash,
} from "lucide-react";
import StatCard, { StatCardSkeleton } from "./StatCard";
import DetailedList from "./DetailedList";

type StatKey = keyof OverviewStats;

export default function Overview() {
  const { user, isLoading: isAuthLoading } = useAuth();
  // We just consume the stats and loading state. The context handles the fetching internally.
  const { stats, isLoading: isLoadingStats } = useDashboard();
  const [activeListKey, setActiveListKey] = useState<StatKey | null>(null);

  const handleStatClick = (key: StatKey) => {
    setActiveListKey((prevKey) => (prevKey === key ? null : key));
  };

  const statCards: { key: StatKey; label: string; icon: React.ElementType }[] =
    [
      { key: "totalUsers", label: "Total Users", icon: Users },
      { key: "onlineUsers", label: "Online Users", icon: Wifi },
      { key: "deactivatedUsers", label: "Deactivated Users", icon: UserX },
      { key: "totalGroups", label: "Total Groups", icon: MessageCircle },
      {
        key: "deactivatedGroups",
        label: "Deactivated Groups",
        icon: CircleSlash,
      },
    ];

  if (isAuthLoading) {
    return <div className="p-8">Loading admin session...</div>;
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.full_name || user?.username}!
        </h1>
        <p className="text-muted-foreground">
          Here's a summary of your tenant system.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={KeyRound}
          label="Admin Key"
          value={user?.admin_key.toString() || "N/A"}
        />

        {isLoadingStats
          ? Array(5)
              .fill(0)
              .map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map(({ key, label, icon }) => (
              <StatCard
                key={key}
                icon={icon}
                label={label}
                value={stats ? stats[key].length.toString() : "0"}
                onClick={() => handleStatClick(key)}
                isActive={activeListKey === key}
              />
            ))}
      </div>

      <div className="mt-10">
        {activeListKey && stats && (
          <DetailedList
            title={`List of ${
              statCards.find((c) => c.key === activeListKey)?.label
            }`}
            data={stats[activeListKey]}
            type={activeListKey.includes("Users") ? "user" : "group"}
          />
        )}
      </div>
    </div>
  );
}
