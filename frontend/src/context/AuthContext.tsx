"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { CurrentUser } from "@/components/types";
import { getCurrentUser, logoutUser } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  logout: (reason?: string) => void;
  isLoading: boolean;
  sendMessage: (payload: object) => void;
  lastEvent: any | null;
  // New function to be called by the login page
  handleLoginSuccess: () => Promise<CurrentUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const router = useRouter();
  const ws = useRef<WebSocket | null>(null);

  const logout = async (reason?: string) => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      const redirectUrl = reason
        ? `/login?reason=${encodeURIComponent(reason)}`
        : "/login";
      window.location.href = redirectUrl;
    }
  };

  // This is the new function that solves the race condition
  const handleLoginSuccess = async (): Promise<CurrentUser> => {
    try {
      const userData = await getCurrentUser();
      setUser(userData); // Set the user state
      return userData; // Return the user data to the login page
    } catch (error) {
      // If this fails, something is wrong with the session, so log out
      logout();
      throw new Error("Failed to initialize session after login.");
    }
  };

  useEffect(() => {
    if (user && !ws.current) {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:8000/api/v1/chat/ws`;
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => console.log("WebSocket Connected");
      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "force_logout") {
            logout(data.reason);
            return;
          }
          setLastEvent(data);
        } catch (error) {
          console.error("Failed to parse incoming message:", error);
        }
      };
      ws.current.onclose = () => {
        ws.current = null;
      };
      ws.current.onerror = (error) => console.error("WebSocket Error:", error);
    }
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user]);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setUser(await getCurrentUser());
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const sendMessage = (payload: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        logout,
        isLoading,
        sendMessage,
        lastEvent,
        handleLoginSuccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
