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
import { RealtimeMessage } from "@/components/types"; // Import RealtimeMessage type

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
  // v-- get lastEvent and sendMessage from useSocket --v
  const { lastEvent, sendMessage } = useSocket();

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

  // --- MODIFICATION START ---
  // Effect for handling incoming real-time messages
  // useEffect(() => {
  //   if (lastEvent && user) {
  //     // Check if the event is a new message
  //     if (
  //       lastEvent.event === "new_message" &&
  //       (lastEvent.type === "private" || lastEvent.type === "group")
  //     ) {
  //       const msg = lastEvent as RealtimeMessage;

  //       // Ignore messages sent by the current user
  //       if (msg.sender.id === user.id) return;

  //       const incomingChatId =
  //         msg.type === "group"
  //           ? `group-${msg.group!.id}`
  //           : `${msg.sender.role}-${msg.sender.id}`;

  //       // If the chat is already open, the message is instantly "read."
  //       if (incomingChatId === activeChatId) {
  //         if (msg.type === "private") {
  //           sendMessage({
  //             event: "messages_read",
  //             partner: { id: msg.sender.id, role: msg.sender.role },
  //           });
  //         } else {
  //           // It's a group message
  //           sendMessage({
  //             event: "messages_read",
  //             group_id: msg.group!.id,
  //           });
  //         }
  //       } else {
  //         // If the chat is not open, increment the unread count
  //         console.log("Incrementing unread count for", incomingChatId);
  //         setUnreadCounts((prev) => {
  //           const newCounts = new Map(prev);
  //           const currentCount = newCounts.get(incomingChatId) || 0;
  //           newCounts.set(incomingChatId, currentCount + 1);
  //           console.log("Updated unread counts:", newCounts);
  //           return newCounts;
  //         });
  //       }
  //     }
  //   }
  // }, [lastEvent, user, activeChatId, sendMessage]);
  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Effect for handling incoming real-time messages
  // This now ONLY depends on lastEvent, preventing re-processing.
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

        // Use the value from the ref to get the CURRENT active chat
        if (incomingChatId === activeChatIdRef.current) {
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
