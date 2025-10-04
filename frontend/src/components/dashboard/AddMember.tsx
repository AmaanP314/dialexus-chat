"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { addGroupMember } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";
import { InteractiveUserTable } from "./InteractiveUserTable";
import { AdminViewGroup } from "../types";
import Avatar from "../Avatar"; // Make sure to import the Avatar component
import { UserPlus, CheckCircle, AlertTriangle } from "lucide-react";

const AddMember = () => {
  const {
    stats,
    isLoading: isStatsLoading,
    refetchGroupLists,
  } = useDashboard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const activeGroups = useMemo(
    () => stats?.totalGroups.filter((g) => g.is_active) || [],
    [stats]
  );
  const selectedGroup = useMemo(
    () => activeGroups.find((g) => g.id === selectedGroupId),
    [activeGroups, selectedGroupId]
  );

  const availableUsers = useMemo(() => {
    if (!stats || !selectedGroup) return [];
    const memberIds = new Set(selectedGroup.members.map((m) => m.user_id));
    const deactivatedIds = new Set(stats.deactivatedUsers.map((u) => u.id));
    return stats.totalUsers.filter(
      (u) => !memberIds.has(u.id) && !deactivatedIds.has(u.id)
    );
  }, [stats, selectedGroup]);

  const handleAddMember = async () => {
    if (!selectedGroupId || !selectedUserId) return;
    setIsLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await addGroupMember(selectedGroupId, selectedUserId);
      setMessage(
        `Successfully added user to group "${selectedGroup?.name || ""}".`
      );
      refetchGroupLists(); // Refetch to get updated member list
    } catch (err) {
      setMessage("Failed to add member. They may already be in the group.");
      setIsError(true);
    } finally {
      setIsLoading(false);
      setSelectedUserId(null); // Reset user selection after action
    }
  };

  if (isStatsLoading && !stats) {
    return <div className="p-4 text-center">Loading data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Add Member to Group
          </h2>
          <p className="text-muted-foreground text-sm">
            Select a group, then choose a user to add as a member.
          </p>
        </div>
      </div>

      {/* Step 1: Select a Group */}
      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4 text-lg">
          <span className="text-primary font-bold">Step 1:</span> Select a Group
        </h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={(id) => {
            setSelectedGroupId(id);
            setSelectedUserId(null); // Reset user selection when group changes
            setMessage("");
          }}
          selectedGroupId={selectedGroupId}
        />
      </div>

      {/* Step 2: Select a User to Add (if a group is selected) */}
      {selectedGroup && (
        <div className="bg-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-lg">
            <span className="text-primary font-bold">Step 2:</span> Select a
            User to Add to "{selectedGroup.name}"
          </h3>
          <InteractiveUserTable
            users={availableUsers}
            onUserSelect={setSelectedUserId}
            selectedUserId={selectedUserId}
          />
        </div>
      )}

      {/* Final Action Button & Message */}
      <div className="text-center pt-4">
        <button
          onClick={handleAddMember}
          disabled={!selectedGroupId || !selectedUserId || isLoading}
          className="w-full max-w-md px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Adding Member..." : "Add Selected Member to Group"}
        </button>
        {message && (
          <div
            className={`max-w-md mx-auto mt-4 flex items-center justify-center gap-2 p-3 rounded-lg text-sm ${
              isError
                ? "bg-red-900/30 text-red-300"
                : "bg-green-900/50 text-green-300"
            }`}
          >
            {isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default AddMember;
