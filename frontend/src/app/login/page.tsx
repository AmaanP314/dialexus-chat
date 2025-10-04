"use client";

import React, { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginUser, getCurrentUser } from "@/lib/api";

// This component contains the actual logic and can use the searchParams hook
function LoginForm() {
  useEffect(() => {
    document.title = "DC | Login";
  }, []);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // On component mount, check for a reason in the URL
  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason) {
      setNotification(reason);
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setNotification(null); // Clear notification on new login attempt

    try {
      const response = await loginUser({ username, password });
      if (response.ok) {
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Invalid credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-muted rounded-2xl shadow-lg">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <MessageSquareText className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Sign in to your account
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to access your tenant.
        </p>
      </div>

      {/* Notification box for forced logout reason */}
      {notification && (
        <div className="p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-muted-foreground"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 mt-1 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-muted-foreground"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 mt-1 text-foreground bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

// Spinner component
function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary" />
    </div>
  );
}
