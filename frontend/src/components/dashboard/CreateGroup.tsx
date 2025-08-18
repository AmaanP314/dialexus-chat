// --- src/components/dashboard/CreateGroup.tsx (New File) ---
"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { createGroup } from "@/lib/api";
import { AdminViewUser, CreatedGroup } from "../types";
import { X, Search, ChevronDown } from "lucide-react";
import Avatar from "../Avatar";

const ROWS_PER_PAGE = 5;

const CreateGroup: React.FC = () => {
  const {
    stats,
    isLoading: isStatsLoading,
    refetchGroupLists,
  } = useDashboard();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<AdminViewUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CreatedGroup | null>(null);

  const activeUsers = useMemo(() => {
    if (!stats) return [];
    const deactivatedIds = new Set(stats.deactivatedUsers.map((u) => u.id));
    return stats.totalUsers.filter((u) => !deactivatedIds.has(u.id));
  }, [stats]);

  const availableUsers = useMemo(() => {
    const selectedIds = new Set(selectedMembers.map((m) => m.id));
    const filtered = activeUsers.filter((u) => !selectedIds.has(u.id));
    return filtered.filter((u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeUsers, selectedMembers, searchTerm]);

  const visibleAvailableUsers = useMemo(() => {
    return availableUsers.slice(0, visibleRows);
  }, [availableUsers, visibleRows]);

  const handleSelectUser = (user: AdminViewUser) => {
    setSelectedMembers((prev) => [...prev, user]);
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async () => {
    if (!groupName || selectedMembers.length === 0) {
      setError("Group name and at least one member are required.");
      return;
    }
    setIsCreating(true);
    setError(null);
    setSuccessData(null);
    try {
      const memberIds = selectedMembers.map((m) => m.id);
      const newGroup = await createGroup(groupName, memberIds);
      setSuccessData(newGroup);
      refetchGroupLists(); // Refetch group lists to show the new group
      // Reset form
      setGroupName("");
      setSelectedMembers([]);
    } catch (err: any) {
      setError(err.message || "Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isStatsLoading) return <div>Loading user data...</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Create New Group</h2>

      <div className="bg-background p-6 rounded-lg border border-border space-y-4">
        <input
          type="text"
          placeholder="Enter Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full px-4 py-2 bg-muted rounded-lg"
        />
      </div>

      {/* Selected Members Section */}
      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4">
          Selected Members ({selectedMembers.length})
        </h3>
        {selectedMembers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 bg-muted p-1 pr-2 rounded-full"
              >
                <Avatar name={user.username} className="w-6 h-6 text-xs" />
                <span className="text-sm font-medium">{user.username}</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select users from the list below.
          </p>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={isCreating || !groupName || selectedMembers.length === 0}
          className="w-1/2 px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreating ? "Creating Group..." : "Create Group"}
        </button>
      </div>

      {/* Available Users Section */}
      <div className="bg-background p-6 rounded-lg border border-border">
        <h3 className="font-semibold mb-4">Available Users</h3>
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <input
            type="text"
            placeholder="Search available users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted"
          />
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <tbody>
              {visibleAvailableUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-b-0">
                  <td className="p-3 flex items-center gap-3">
                    <Avatar name={user.username} className="w-8 h-8" />
                    <span className="font-medium">{user.username}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="text-sm text-primary hover:underline"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {availableUsers.length === 0 && (
            <p className="text-center p-4 text-muted-foreground">
              No available users found.
            </p>
          )}
        </div>
        {visibleRows < availableUsers.length && (
          <div className="text-center mt-4">
            <button
              onClick={() => setVisibleRows((p) => p + ROWS_PER_PAGE)}
              className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              Show More <ChevronDown size={16} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}
      {successData && (
        <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-center">
          <h3 className="font-semibold text-green-300">
            Group Created Successfully!
          </h3>
          <p>Group Name: {successData.name}</p>
          <p>Group ID: {successData.id}</p>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;
