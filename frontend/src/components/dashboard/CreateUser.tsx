"use client";

import React, { useState } from "react";
import { AdminViewUser } from "../types";
import { createUser } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { Copy, Check, UserPlus } from "lucide-react";
import { InteractiveUserTable } from "./InteractiveUserTable"; // Re-using the table for context

interface CreateUserProps {
  allUsers: AdminViewUser[];
  setSuccessData: (data: { user: AdminViewUser; pass: string } | null) => void;
  successData: { user: AdminViewUser; pass: string } | null;
}

const CreateUser: React.FC<CreateUserProps> = ({
  allUsers,
  setSuccessData,
  successData,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { addNewUserToCache } = useDashboard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessData(null); // Clear previous success message
    try {
      const newUser = await createUser({
        username,
        password,
        full_name: fullName,
      });
      setSuccessData({ user: newUser, pass: password });
      addNewUserToCache(newUser);
      setUsername("");
      setPassword("");
      setFullName("");
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!successData) return;
    navigator.clipboard.writeText(successData.pass);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-lg">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Create New User
            </h2>
            <p className="text-muted-foreground text-sm">
              Add a new user to your tenant system.
            </p>
          </div>
        </div>
        <div className="bg-background p-6 rounded-lg border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., john.doe"
                required
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label
                htmlFor="fullname"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Full Name (Optional)
              </label>
              <input
                id="fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Creating..." : "Create User"}
            </button>
          </form>

          {error && (
            <p className="text-red-400 bg-red-900/30 p-3 rounded-lg mt-4 text-sm">
              {error}
            </p>
          )}

          {successData && (
            <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg space-y-3">
              <h3 className="font-semibold text-green-300">
                User Created Successfully!
              </h3>
              <p className="text-sm text-foreground">
                ID:{" "}
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  {successData.user.id}
                </span>
              </p>
              <p className="text-sm text-foreground">
                Username:{" "}
                <span className="font-semibold">
                  {successData.user.username}
                </span>
              </p>
              {successData.user.full_name && (
                <p className="text-sm text-foreground">
                  Full Name:{" "}
                  <span className="font-semibold">
                    {successData.user.full_name}
                  </span>
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-foreground">Password:</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                    {successData.pass}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                    aria-label="Copy password"
                  >
                    {isCopied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="lg:col-span-2">
        <h3 className="text-xl font-semibold mb-4">Existing Users</h3>
        <InteractiveUserTable
          users={allUsers}
          onUserSelect={() => {}}
          selectedUserId={null}
        />
      </div>
    </div>
  );
};

export default CreateUser;
