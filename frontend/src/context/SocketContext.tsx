// src/context/SocketContext.tsx

"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { refreshToken } from "@/lib/api";

// This type was previously in AuthContext
interface PresenceState {
  [key: string]: {
    status: "online" | "offline";
    lastSeen: string | null;
  };
}

interface SocketContextType {
  sendMessage: (payload: object) => void;
  lastEvent: any | null;
  initialPresenceState: PresenceState | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const [lastEvent, setLastEvent] = useState<any | null>(null);
  const [initialPresenceState, setInitialPresenceState] =
    useState<PresenceState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  const handleLogout = useCallback(
    (reason?: string) => {
      logout(reason);
    },
    [logout]
  );

  useEffect(() => {
    // Only run this logic if the user is logged in
    if (user) {
      // Set an interval to refresh the token every 10 minutes
      const REFRESH_INTERVAL = 14 * 60 * 1000; // 10 minutes in milliseconds

      const intervalId = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error("Periodic token refresh failed:", error);
          // If refresh fails (e.g., refresh token expired), log the user out.
          logout("Your session has expired. Please log in again.");
          clearInterval(intervalId); // Stop the timer
        }
      }, REFRESH_INTERVAL);

      // IMPORTANT: Cleanup function to clear the interval
      // This runs when the user logs out or the component unmounts
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [user, logout]);

  useEffect(() => {
    // Connect only if we have a user and there's no existing connection
    if (user && !ws.current) {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.error("WebSocket URL is not defined.");
        return;
      }
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "force_logout") {
            handleLogout(data.reason);
            return;
          }

          if (data.event === "initial_presence_state") {
            setInitialPresenceState(data.users);
          }

          setLastEvent(data);
        } catch (error) {
          console.error("Failed to parse incoming message:", error);
        }
      };

      ws.current.onclose = () => {
        console.log("WebSocket Disconnected");
        setIsConnected(false);
        ws.current = null;
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setIsConnected(false);
      };
    }

    // Cleanup on user change (logout) or component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [user, handleLogout]);

  const sendMessage = (payload: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        sendMessage,
        lastEvent,
        initialPresenceState,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
