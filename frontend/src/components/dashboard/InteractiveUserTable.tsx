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
        // Filter by username, ID, or any other visible field for a robust search
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm)
    );
  }, [users, searchTerm]);

  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleRows);
  }, [filteredUsers, visibleRows]);

  // Determine if full_name property exists in the user object for dynamic column rendering
  const hasFullName = users.length > 0 && "full_name" in users[0];

  return (
    <div className="space-y-6">
      {" "}
      {/* Increased vertical spacing */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <input
          type="text"
          placeholder="Search by username or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/70 shadow-inner transition duration-150" // Improved input styling
        />
      </div>
      <div className="border border-border rounded-xl shadow-lg overflow-x-auto">
        {" "}
        {/* Added shadow and increased rounding */}
        <table className="min-w-full text-left text-sm table-auto">
          <thead className="bg-muted/70 sticky top-0 border-b border-border">
            {" "}
            {/* Made header slightly more prominent and sticky */}
            <tr>
              {/* Removed the 'Select' column header */}
              <th className="p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-1/4">
                ID
              </th>
              {hasFullName && (
                <th className="p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider w-1/4">
                  Full Name
                </th>
              )}
              <th className="p-4 font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Username
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserSelect(user.id)} // Entire row is now clickable
                className={`
                  border-b border-border/70 last:border-b-0 
                  cursor-pointer 
                  transition-colors duration-150 ease-in-out
                  ${
                    selectedUserId === user.id
                      ? "bg-primary/15 text-foreground font-semibold shadow-inner" // Stronger selected state
                      : "hover:bg-muted/50" // Added clear hover effect
                  }
                `}
              >
                <td className="p-4 font-mono text-xs text-muted-foreground/80">
                  {user.id}
                </td>
                {hasFullName && (
                  <td className="p-4 text-foreground/90 font-medium">
                    {(user as any).full_name || "N/A"}
                  </td>
                )}
                <td className="p-4 font-medium text-foreground">
                  {user.username}
                </td>
                {/* Removed the 'Select' data cell */}
              </tr>
            ))}
            {visibleUsers.length === 0 && (
              <tr>
                <td
                  colSpan={hasFullName ? 3 : 2}
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
            className="text-sm font-medium text-primary hover:text-primary/80 hover:underline flex items-center gap-1 mx-auto py-2 px-4 rounded-full border border-primary/50 bg-primary/10 transition duration-150 hover:bg-primary/20"
          >
            Load More Users ({filteredUsers.length - visibleRows} remaining){" "}
            <ChevronDown size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
