"use client";

import React, { useState } from "react";
import {
  BarChart,
  Users,
  MessageCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Overview from "@/components/dashboard/Overview";
import { DashboardProvider } from "@/context/DashboardContext";
import UserManagement from "@/components/dashboard/UserManagement";
import GroupManagement from "@/components/dashboard/GroupManagement";

const DashboardSidebar = ({
  activeTab,
  setActiveTab,
  activeSubTab,
  setActiveSubTab,
}: any) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      subTabs: [
        { id: "createUser", label: "Create User" },
        { id: "deactivateUser", label: "Deactivate User" },
        { id: "reactivateUser", label: "Reactivate User" },
        { id: "resetPassword", label: "Reset Password" },
      ],
    },
    {
      id: "groups",
      label: "Group Management",
      icon: MessageCircle,
      subTabs: [
        { id: "createGroup", label: "Create Group" },
        { id: "addMembers", label: "Add Members" },
        { id: "removeMembers", label: "Remove Members" },
        { id: "deactivateGroup", label: "Delete Group" },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-background border-r border-border p-6 flex-shrink-0">
      <h2 className="text-lg font-semibold text-foreground mb-8">
        Admin Panel
      </h2>
      <ul className="space-y-1">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <button
              onClick={() => setActiveTab(tab.id === activeTab ? null : tab.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon size={18} />
                {tab.label}
              </div>
              {tab.subTabs &&
                (activeTab === tab.id ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                ))}
            </button>
            {tab.subTabs && activeTab === tab.id && (
              <ul className="pl-8 pt-2 space-y-1">
                {tab.subTabs.map((subTab) => (
                  <li key={subTab.id}>
                    <button
                      onClick={() => setActiveSubTab(subTab.id)}
                      className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors ${
                        activeSubTab === subTab.id
                          ? "text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {subTab.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
};

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState("");

  const handleSetActiveTab = (tabId: string) => {
    // Toggle behavior for the main tab
    setActiveTab((prevTab) => (prevTab === tabId ? "" : tabId));
    setActiveSubTab(""); // Reset sub-tab when main tab changes
  };

  return (
    <div className="flex h-full">
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
      />
      <div className="flex-grow p-8 bg-muted/30 overflow-y-auto">
        {activeTab === "overview" && <Overview />}
        {activeTab === "users" && (
          <UserManagement activeSubTab={activeSubTab} />
        )}
        {activeTab === "groups" && (
          <GroupManagement activeSubTab={activeSubTab} />
        )}
      </div>
    </div>
  );
};

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
