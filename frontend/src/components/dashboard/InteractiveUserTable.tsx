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
    return users.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleRows);
  }, [filteredUsers, visibleRows]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 w-12">Select</th>
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-border last:border-b-0 ${
                  selectedUserId === user.id ? "bg-primary/10" : ""
                }`}
              >
                <td className="p-3 text-center">
                  <input
                    type="radio"
                    name="user-select"
                    checked={selectedUserId === user.id}
                    onChange={() => onUserSelect(user.id)}
                    className="accent-primary"
                  />
                </td>
                <td className="p-3 font-mono text-xs">{user.id}</td>
                <td className="p-3 font-medium text-foreground">
                  {user.username}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <p className="text-center p-4 text-muted-foreground">
            No users found.
          </p>
        )}
      </div>
      {visibleRows < filteredUsers.length && (
        <div className="text-center">
          <button
            onClick={() => setVisibleRows((prev) => prev + ROWS_PER_PAGE)}
            className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
          >
            Show More <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
