"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { loginUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { handleLoginSuccess } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const loginResponse = await loginUser({ username, password });

      if (loginResponse.ok) {
        // Step 1: Login was successful and the browser now has the cookie.

        // Step 2: Call the context to fetch user data and set the session state.
        // We AWAIT this to ensure it completes BEFORE we redirect.
        const user = await handleLoginSuccess();
        const userRole = user.type;

        // Step 3: Now that the session is fully initialized, we can safely redirect.
        if (userRole === "admin" || userRole === "super_admin") {
          router.push("/dashboard");
        } else {
          router.push("/chat");
        }
      } else {
        const errorData = await loginResponse.json();
        setError(errorData.detail || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-muted rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <MessageSquareText className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Sign in to your account
          </h1>
        </div>
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
              autoComplete="username"
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
              autoComplete="current-password"
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
    </div>
  );
}
