"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";

interface PresenceState {
  [key: string]: {
    status: "online" | "offline";
    lastSeen: string | null;
  };
}

interface PresenceContextType {
  presence: PresenceState;
}

const PresenceContext = createContext<PresenceContextType | undefined>(
  undefined
);

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const [presence, setPresence] = useState<PresenceState>({});
  const { lastEvent } = useAuth();

  useEffect(() => {
    if (!lastEvent) return;
    // Case 1: The backend sends the initial list of all online users upon connection.
    if (lastEvent.event === "initial_presence_state") {
      // The payload `lastEvent.users` is the map of all currently online users.
      // We merge this with any existing state.
      setPresence((prevState) => ({ ...prevState, ...lastEvent.users }));
    }

    // Case 2: The backend sends an update for a single user's status change.
    if (lastEvent.event === "presence_update") {
      const { user, status, timestamp } = lastEvent;
      const userKey = `${user.role}-${user.id}`;

      setPresence((prevPresence) => ({
        ...prevPresence,
        [userKey]: {
          status: status,
          lastSeen: status === "offline" ? timestamp : null,
        },
      }));
    }
  }, [lastEvent]);

  return (
    <PresenceContext.Provider value={{ presence }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
};
