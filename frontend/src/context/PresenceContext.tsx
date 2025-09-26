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

// export const PresenceProvider = ({ children }: { children: ReactNode }) => {
//   const [presence, setPresence] = useState<PresenceState>({});
//   const { lastEvent } = useAuth();

//   useEffect(() => {
//     if (!lastEvent) return;
//     // Case 1: The backend sends the initial list of all online users upon connection.
//     if (lastEvent.event === "initial_presence_state") {
//       // The payload `lastEvent.users` is the map of all currently online users.
//       // We merge this with any existing state.
//       setPresence((prevState) => ({ ...prevState, ...lastEvent.users }));
//     }

//     // Case 2: The backend sends an update for a single user's status change.
//     if (lastEvent.event === "presence_update") {
//       const { user, status, timestamp } = lastEvent;
//       const userKey = `${user.role}-${user.id}`;

//       setPresence((prevPresence) => ({
//         ...prevPresence,
//         [userKey]: {
//           status: status,
//           lastSeen: status === "offline" ? timestamp : null,
//         },
//       }));
//     }
//   }, [lastEvent]);

//   return (
//     <PresenceContext.Provider value={{ presence }}>
//       {children}
//     </PresenceContext.Provider>
//   );
// };

// export const usePresence = (): PresenceContextType => {
//   const context = useContext(PresenceContext);
//   if (context === undefined) {
//     throw new Error("usePresence must be used within a PresenceProvider");
//   }
//   return context;
// };

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const [presence, setPresence] = useState<PresenceState>({});
  const { lastEvent, initialPresenceState } = useAuth();

  // 1. useEffect for INITIALIZATION ONLY
  // We use a separate useEffect to handle initialization from initialPresenceState
  // This runs once when the component mounts and the initial state is available.
  useEffect(() => {
    if (initialPresenceState) {
      // ONLY set the initial state if it's not already set
      setPresence((prevState) => {
        // Prevent resetting state if it's already been populated
        if (Object.keys(prevState).length === 0) {
          return initialPresenceState;
        }
        return prevState;
      });
    }
  }, [initialPresenceState]); // Dependency: Only runs when initial state changes/arrives

  // 2. useEffect for REAL-TIME UPDATES
  // This hook runs every time a new event (lastEvent) arrives.
  useEffect(() => {
    if (!lastEvent) return;

    // CRITICAL: We do NOT want to process the initial_presence_state here,
    // as the first useEffect handles that. We only want 'presence_update'.

    // Case 1: Initial state (Can be removed, but if kept, ensure it doesn't overwrite real-time updates)
    // You can probably remove this whole block now if you rely on the first useEffect.
    if (lastEvent.event === "initial_presence_state") {
      // Only merge if state is empty, to prevent overwriting updates
      setPresence((prevState) => {
        if (Object.keys(prevState).length === 0) {
          return { ...prevState, ...lastEvent.users };
        }
        return prevState;
      });
    }

    // Case 2: The backend sends an update for a single user's status change. (This is what wasn't working)
    if (lastEvent.event === "presence_update") {
      const { user, status, timestamp } = lastEvent;
      const userKey = `${user.role}-${user.id}`;

      // This block MUST run to update the state.
      setPresence((prevPresence) => ({
        ...prevPresence,
        [userKey]: {
          status: status,
          lastSeen: status === "offline" ? timestamp : null,
        },
      }));
    }
  }, [lastEvent]); // Dependency: Runs only when a new lastEvent arrives

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
