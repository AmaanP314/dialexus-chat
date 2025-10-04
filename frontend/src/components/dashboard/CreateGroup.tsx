// --- src/components/dashboard/CreateGroup.tsx (New File) ---
"use client";

import React, { useState, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { createGroup } from "@/lib/api";
import { AdminViewUser, CreatedGroup } from "../types";
import { X, Search, ChevronDown, Users, CheckCircle } from "lucide-react";
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
    return filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name &&
          u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
    if (!groupName.trim() || selectedMembers.length === 0) {
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
      setSearchTerm("");
    } catch (err: any) {
      setError(err.message || "Failed to create group.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isStatsLoading) return <div>Loading user data...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Create New Group
          </h2>
          <p className="text-muted-foreground text-sm">
            Define a name and add members to form a new group.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Group Details & Selected Members */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-background p-6 rounded-lg border border-border">
            <label
              htmlFor="groupName"
              className="block text-sm font-medium text-muted-foreground mb-2"
            >
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              placeholder="Enter a name for your group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="bg-background p-6 rounded-lg border border-border">
            <h3 className="font-semibold mb-4">
              Selected Members ({selectedMembers.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {selectedMembers.length > 0 ? (
                selectedMembers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-2 bg-muted p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={user.username}
                        className="w-8 h-8 text-xs"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.full_name || "No full name"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 rounded-full hover:bg-red-500/10"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select users from the list to add them here.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              isCreating || !groupName.trim() || selectedMembers.length === 0
            }
            className="w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isCreating ? "Creating Group..." : "Create Group"}
          </button>
        </div>

        {/* Right Column: Available Users */}
        <div className="lg:col-span-2 bg-background p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4">Available Users to Add</h3>
          <div className="relative mb-4">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by username or full name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="p-3 font-semibold text-muted-foreground text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleAvailableUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/70 last:border-b-0"
                  >
                    <td className="p-3 flex items-center gap-3">
                      <Avatar name={user.username} className="w-8 h-8" />
                      <div>
                        <p className="font-medium text-foreground">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.full_name}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleSelectUser(user)}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {availableUsers.length === 0 && (
              <p className="text-center p-6 text-muted-foreground">
                No available users found.
              </p>
            )}
          </div>
          {visibleRows < availableUsers.length && (
            <div className="text-center mt-4">
              <button
                onClick={() => setVisibleRows((p) => p + ROWS_PER_PAGE)}
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 mx-auto"
              >
                Load More <ChevronDown size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-400 bg-red-900/30 p-3 rounded-lg mt-4 text-sm text-center">
          {error}
        </p>
      )}
      {successData && (
        <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg flex flex-col items-center text-center gap-2">
          <CheckCircle className="w-8 h-8 text-green-400" />
          <h3 className="font-semibold text-green-300">
            Group Created Successfully!
          </h3>
          <p className="text-sm text-foreground">
            Group Name:{" "}
            <span className="font-semibold">{successData.name}</span>
          </p>
          <p className="text-sm text-foreground">
            Group ID:{" "}
            <span className="font-mono bg-muted px-2 py-1 rounded">
              {successData.id}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default CreateGroup;
