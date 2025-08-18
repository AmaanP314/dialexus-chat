"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { addGroupMember } from "@/lib/api";
import { InteractiveGroupTable } from "./InteractiveGroupTable";
import { InteractiveUserTable } from "./InteractiveUserTable";
import { AdminViewGroup } from "../types";
import Avatar from "../Avatar"; // Make sure to import the Avatar component

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
      setMessage("Member added successfully.");
      refetchGroupLists(); // Refetch to get updated member list
    } catch (err) {
      setMessage("Failed to add member.");
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
      <h2 className="text-2xl font-bold text-foreground">
        Add Member to Group
      </h2>

      {/* Step 1: Select a Group */}
      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4 text-lg">1. Select a Group</h3>
        <InteractiveGroupTable
          groups={activeGroups}
          onGroupSelect={setSelectedGroupId}
          selectedGroupId={selectedGroupId}
        />
      </div>

      {/* Step 2: Display Current Members (if a group is selected) */}
      {selectedGroup && (
        <div className="bg-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-lg">
            Current Members in "{selectedGroup.name}" (
            {selectedGroup.members.length})
          </h3>
          {selectedGroup.members.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedGroup.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-2 bg-muted p-1 pr-3 rounded-full"
                >
                  <Avatar name={member.username} className="w-6 h-6 text-xs" />
                  <span className="text-sm font-medium">{member.username}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This group has no members yet.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Select a User to Add (if a group is selected) */}
      {selectedGroup && (
        <div className="bg-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-lg">
            2. Select a User to Add
          </h3>
          <InteractiveUserTable
            users={availableUsers}
            onUserSelect={setSelectedUserId}
            selectedUserId={selectedUserId}
          />
        </div>
      )}

      {/* Final Action Button */}
      <div className="text-center pt-4">
        <button
          onClick={handleAddMember}
          disabled={!selectedGroupId || !selectedUserId || isLoading}
          className="w-1/2 px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Adding..." : "Add Selected Member"}
        </button>
        {message && (
          <p
            className={`text-sm mt-4 ${
              isError ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
export default AddMember;
