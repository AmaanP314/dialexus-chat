"use client";

import React, { useState, useMemo } from "react";
import { AdminViewUser } from "../types";
import { Search, ChevronDown } from "lucide-react";

interface InteractiveUserTableProps {
  users: AdminViewUser[];
  onUserSelect: (userId: number) => void;
  selectedUserId: number | null;
}

const ROWS_PER_PAGE = 10;

export const InteractiveUserTable: React.FC<InteractiveUserTableProps> = ({
  users,
  onUserSelect,
  selectedUserId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name &&
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        user.id.toString().includes(searchTerm)
    );
  }, [users, searchTerm]);

  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleRows);
  }, [filteredUsers, visibleRows]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by username, full name, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition duration-200"
        />
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="min-w-full text-left text-sm table-auto">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-4 font-semibold text-muted-foreground">ID</th>
              <th className="p-4 font-semibold text-muted-foreground">
                Username
              </th>
              <th className="p-4 font-semibold text-muted-foreground">
                Full Name
              </th>
              <th className="p-4 font-semibold text-muted-foreground">
                Created At
              </th>
              <th className="p-4 font-semibold text-muted-foreground">
                Last Seen
              </th>
              <th className="p-4 font-semibold text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className={`
                  border-b border-border/70 last:border-b-0 
                  cursor-pointer 
                  transition-colors duration-150 ease-in-out
                  ${
                    selectedUserId === user.id
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  }
                `}
              >
                <td className="p-4 font-mono text-xs text-muted-foreground">
                  {user.id}
                </td>
                <td className="p-4 font-medium text-foreground">
                  {user.username}
                </td>
                <td className="p-4 text-muted-foreground">
                  {user.full_name || "N/A"}
                </td>
                <td className="p-4 text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-muted-foreground">
                  {new Date(user.last_seen).toLocaleString()}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.is_active
                        ? "bg-green-900/50 text-green-300"
                        : "bg-red-900/50 text-red-300"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-6 text-muted-foreground"
                >
                  No users match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Load More Button */}
      {visibleRows < filteredUsers.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setVisibleRows((prev) => prev + ROWS_PER_PAGE)}
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 mx-auto py-2 px-4 rounded-lg transition duration-150"
          >
            Load More <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
