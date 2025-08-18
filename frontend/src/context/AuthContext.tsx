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
  lastEvent: any | null; // The single source for all WS events
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
      // Still attempt to call the backend logout endpoint
      await logoutUser();
    } catch (error) {
      console.error(
        "Logout API call failed, proceeding with client-side logout:",
        error
      );
    } finally {
      // Clear local state
      setUser(null);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }

      // Redirect with or without a reason
      if (reason) {
        const encodedReason = encodeURIComponent(reason);
        router.push(`/login?reason=${encodedReason}`);
      } else {
        router.push("/login");
      }
    }
  };
  useEffect(() => {
    if (user && !ws.current) {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.error(
          "WebSocket URL is not defined. Please check your environment variables."
        );
        return;
      }
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => console.log("WebSocket Connected");

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Update the state with the latest event from the server
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
    return () => ws.current?.close();
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
