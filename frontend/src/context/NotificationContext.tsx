// src/context/NotificationContext.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { getNotificationSummary } from "@/lib/api";
import { useSocket } from "./SocketContext";
import { RealtimeMessage } from "@/components/types";

interface NotificationContextType {
  unreadCounts: Map<string, number>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  clearUnreadCount: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
    new Map()
  );
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { user } = useAuth();
  const { lastEvent, sendMessage } = useSocket();

  // Audio instance for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.5; // Adjust volume as needed
    }
  }, []);

  // Effect for fetching the initial summary on login
  useEffect(() => {
    if (user) {
      const fetchSummary = async () => {
        try {
          const summary = await getNotificationSummary();
          const newCounts = new Map<string, number>();
          summary.notifications.forEach((item) => {
            if (item.unread_count > 0) {
              const compositeKey = `${item.conversation_details.type}-${item.conversation_details.id}`;
              newCounts.set(compositeKey, item.unread_count);
            }
          });
          setUnreadCounts(newCounts);
        } catch (error) {
          console.error("Failed to fetch notification summary:", error);
        }
      };
      fetchSummary();
    }
  }, [user]);

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Function to play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      // Reset to start in case it's already playing
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.error("Failed to play notification sound:", error);
      });
    }
  };

  // Effect for handling incoming real-time messages
  useEffect(() => {
    if (lastEvent && user) {
      if (
        lastEvent.event === "new_message" &&
        (lastEvent.type === "private" || lastEvent.type === "group")
      ) {
        const msg = lastEvent as RealtimeMessage;

        if (msg.sender.id === user.id) return;

        const incomingChatId =
          msg.type === "group"
            ? `group-${msg.group!.id}`
            : `${msg.sender.role}-${msg.sender.id}`;

        const currentActiveChatId = activeChatIdRef.current;
        const isPageVisible = !document.hidden;

        // WhatsApp-like behavior:
        // Play sound if either:
        // 1. Message is from a different conversation
        // 2. Message is from the current conversation BUT user is not viewing the page
        const shouldPlaySound =
          incomingChatId !== currentActiveChatId ||
          (incomingChatId === currentActiveChatId && !isPageVisible);

        if (shouldPlaySound) {
          playNotificationSound();
        }

        // Mark as read if it's the active chat AND user is viewing the page
        if (incomingChatId === currentActiveChatId && isPageVisible) {
          if (msg.type === "private") {
            sendMessage({
              event: "messages_read",
              partner: { id: msg.sender.id, role: msg.sender.role },
            });
          } else {
            sendMessage({
              event: "messages_read",
              group_id: msg.group!.id,
            });
          }
        } else {
          // Increment unread count
          setUnreadCounts((prev) => {
            const newCounts = new Map(prev);
            const currentCount = newCounts.get(incomingChatId) || 0;
            newCounts.set(incomingChatId, currentCount + 1);
            return newCounts;
          });
        }
      }
    }
  }, [lastEvent, user, sendMessage]);

  // Effect to handle page visibility changes
  // When user comes back to the tab, mark active chat as read
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && activeChatIdRef.current && user) {
        const currentChatId = activeChatIdRef.current;

        // Check if there are unread messages for the active chat
        if (unreadCounts.has(currentChatId)) {
          // Parse the chat ID to determine if it's private or group
          if (currentChatId.startsWith("group-")) {
            const groupId = currentChatId.replace("group-", "");
            sendMessage({
              event: "messages_read",
              group_id: parseInt(groupId),
            });
          } else {
            // It's a private chat: format is "role-id"
            const [role, partnerId] = currentChatId.split("-");
            sendMessage({
              event: "messages_read",
              partner: { id: parseInt(partnerId), role: role },
            });
          }

          // Clear the unread count
          clearUnreadCount(currentChatId);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, sendMessage, unreadCounts]);

  const clearUnreadCount = (id: string) => {
    setUnreadCounts((prev) => {
      const newCounts = new Map(prev);
      if (newCounts.has(id)) {
        newCounts.delete(id);
      }
      return newCounts;
    });
  };

  return (
    <NotificationContext.Provider
      value={{ unreadCounts, activeChatId, setActiveChatId, clearUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
// src/context/NotificationContext.tsx

// "use client";

// import React, {
//   createContext,
//   useContext,
//   useState,
//   ReactNode,
//   useEffect,
//   useRef,
// } from "react";
// import { useAuth } from "./AuthContext";
// import { getNotificationSummary } from "@/lib/api";
// import { useSocket } from "./SocketContext";
// import { RealtimeMessage } from "@/components/types";

// interface NotificationContextType {
//   unreadCounts: Map<string, number>;
//   activeChatId: string | null;
//   setActiveChatId: (id: string | null) => void;
//   clearUnreadCount: (id: string) => void;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(
//   undefined
// );

// export const NotificationProvider = ({ children }: { children: ReactNode }) => {
//   const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(
//     new Map()
//   );
//   const [activeChatId, setActiveChatId] = useState<string | null>(null);
//   const { user } = useAuth();
//   const { lastEvent, sendMessage } = useSocket();

//   // Audio instance for notification sound
//   const audioRef = useRef<HTMLAudioElement | null>(null);

//   // Initialize audio on mount (client-side only)
//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       audioRef.current = new Audio("/notification.mp3");
//       audioRef.current.volume = 0.5; // Adjust volume as needed
//     }
//   }, []);

//   // Effect for fetching the initial summary on login
//   useEffect(() => {
//     if (user) {
//       const fetchSummary = async () => {
//         try {
//           const summary = await getNotificationSummary();
//           const newCounts = new Map<string, number>();
//           summary.notifications.forEach((item) => {
//             if (item.unread_count > 0) {
//               const compositeKey = `${item.conversation_details.type}-${item.conversation_details.id}`;
//               newCounts.set(compositeKey, item.unread_count);
//             }
//           });
//           setUnreadCounts(newCounts);
//         } catch (error) {
//           console.error("Failed to fetch notification summary:", error);
//         }
//       };
//       fetchSummary();
//     }
//   }, [user]);

//   const activeChatIdRef = useRef(activeChatId);
//   useEffect(() => {
//     activeChatIdRef.current = activeChatId;
//   }, [activeChatId]);

//   // Function to play notification sound
//   const playNotificationSound = () => {
//     if (audioRef.current) {
//       // Reset to start in case it's already playing
//       audioRef.current.currentTime = 0;
//       audioRef.current.play().catch((error) => {
//         console.error("Failed to play notification sound:", error);
//       });
//     }
//   };

//   // Effect for handling incoming real-time messages
//   useEffect(() => {
//     if (lastEvent && user) {
//       if (
//         lastEvent.event === "new_message" &&
//         (lastEvent.type === "private" || lastEvent.type === "group")
//       ) {
//         const msg = lastEvent as RealtimeMessage;

//         if (msg.sender.id === user.id) return;

//         const incomingChatId =
//           msg.type === "group"
//             ? `group-${msg.group!.id}`
//             : `${msg.sender.role}-${msg.sender.id}`;

//         const currentActiveChatId = activeChatIdRef.current;
//         const isPageVisible = !document.hidden;

//         // WhatsApp-like behavior:
//         // Play sound if either:
//         // 1. Message is from a different conversation
//         // 2. Message is from the current conversation BUT user is not viewing the page
//         const shouldPlaySound =
//           incomingChatId !== currentActiveChatId ||
//           (incomingChatId === currentActiveChatId && !isPageVisible);

//         if (shouldPlaySound) {
//           playNotificationSound();
//         }

//         // Mark as read if it's the active chat AND user is viewing the page
//         if (incomingChatId === currentActiveChatId && isPageVisible) {
//           if (msg.type === "private") {
//             sendMessage({
//               event: "messages_read",
//               partner: { id: msg.sender.id, role: msg.sender.role },
//             });
//           } else {
//             sendMessage({
//               event: "messages_read",
//               group_id: msg.group!.id,
//             });
//           }
//         } else {
//           // Increment unread count
//           setUnreadCounts((prev) => {
//             const newCounts = new Map(prev);
//             const currentCount = newCounts.get(incomingChatId) || 0;
//             newCounts.set(incomingChatId, currentCount + 1);
//             return newCounts;
//           });
//         }
//       }
//     }
//   }, [lastEvent, user, sendMessage]);

//   const clearUnreadCount = (id: string) => {
//     setUnreadCounts((prev) => {
//       const newCounts = new Map(prev);
//       if (newCounts.has(id)) {
//         newCounts.delete(id);
//       }
//       return newCounts;
//     });
//   };

//   return (
//     <NotificationContext.Provider
//       value={{ unreadCounts, activeChatId, setActiveChatId, clearUnreadCount }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotification = (): NotificationContextType => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     throw new Error(
//       "useNotification must be used within a NotificationProvider"
//     );
//   }
//   return context;
// };
