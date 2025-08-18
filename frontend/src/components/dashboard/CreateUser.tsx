"use client";

import React, { useState } from "react";
import { AdminViewUser } from "../types";
import { createUser } from "@/lib/api";
import { useDashboard } from "@/context/DashboardContext";
import { Copy, Check } from "lucide-react";
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
      const newUser = await createUser({ username, password });
      setSuccessData({ user: newUser, pass: password });
      addNewUserToCache(newUser);
      setUsername("");
      setPassword("");
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground">Create New User</h2>
      <div className="bg-background p-6 rounded-lg border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a unique username"
              required
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a strong password"
              required
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
        </form>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        {successData && (
          <div className="mt-6 p-4 bg-green-900/50 border border-green-700 rounded-lg space-y-2">
            <h3 className="font-semibold text-green-300">
              User Created Successfully!
            </h3>
            <p className="text-sm text-foreground">
              ID: <span className="font-mono">{successData.user.id}</span>
            </p>
            <p className="text-sm text-foreground">
              Username:{" "}
              <span className="font-semibold">{successData.user.username}</span>
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-foreground">Password:</p>
              <span className="font-mono bg-muted px-2 py-1 rounded">
                {successData.pass}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                {isCopied ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Existing Users</h3>
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
