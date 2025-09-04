"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { RealtimeMessage } from "@/components/types";

interface UnreadCounts {
  [key: string]: number;
}

interface NotificationContextType {
  unreadCounts: UnreadCounts;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  clearUnreadCount: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { user, lastEvent, sendMessage } = useAuth();

  useEffect(() => {
    if (lastEvent && user) {
      // Check if the event is a new message by looking for a sender property
      if (
        lastEvent.sender &&
        (lastEvent.type === "private" || lastEvent.type === "group")
      ) {
        const msg = lastEvent as RealtimeMessage;

        // Ignore messages sent by the current user
        if (msg.sender.id === user.id) return;

        const incomingChatId =
          msg.type === "group"
            ? `group-${msg.group!.id}`
            : `user-${msg.sender.id}`;

        // Core logic for unread messages
        if (incomingChatId === activeChatId) {
          // If the chat is already open, the message is instantly "read."
          // Send the 'messages_read' event back to the backend.
          if (msg.type === "private") {
            sendMessage({
              event: "messages_read",
              partner: { id: msg.sender.id, role: msg.sender.role },
            });
          }
        } else {
          // If the chat is not open, increment the unread count
          setUnreadCounts((prev) => ({
            ...prev,
            [incomingChatId]: (prev[incomingChatId] || 0) + 1,
          }));
        }
      }
    }
  }, [lastEvent, user, activeChatId, sendMessage]);

  const clearUnreadCount = (id: string) => {
    setUnreadCounts((prev) => {
      const newCounts = { ...prev };
      if (newCounts[id]) {
        delete newCounts[id];
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
