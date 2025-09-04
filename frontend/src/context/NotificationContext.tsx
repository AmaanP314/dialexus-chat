"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { getNotificationSummary } from "@/lib/api";
import { Notification, RealtimeMessage } from "@/components/types";

interface NotificationContextType {
  notifications: Notification[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  clearUnreadCount: (id: string) => void;
  totalUnreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const { lastEvent, sendMessage } = useSocket();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  // 1. Initial Data Fetch on Login
  useEffect(() => {
    if (isAuthenticated) {
      getNotificationSummary().then((data) => {
        setNotifications(data.notifications);
      });
    } else {
      setNotifications([]); // Clear notifications on logout
    }
  }, [isAuthenticated]);

  // 2. Handle Incoming Messages
  const handleNewMessage = useCallback(
    (msg: RealtimeMessage) => {
      if (!user || msg.sender.id === user.id) return;

      const conversationId =
        msg.type === "group"
          ? `group-${msg.group!.id}`
          : `user-${msg.sender.id}`;

      // If chat is currently open, it's read instantly
      if (conversationId === activeConversationId) {
        sendMessage({
          event: "messages_read",
          ...(msg.type === "group"
            ? { group_id: msg.group!.id }
            : { partner: { id: msg.sender.id, role: msg.sender.role } }),
        });
        return;
      }

      // Otherwise, it's unread. Update the list.
      setNotifications((prev) => {
        const existingNotificationIndex = prev.findIndex(
          (n) =>
            `${n.conversation_details.type}-${n.conversation_details.id}` ===
            conversationId
        );
        const newNotifications = [...prev];

        const newNotificationData = {
          conversation_details:
            msg.type === "group"
              ? { id: msg.group!.id, name: msg.group!.name, type: "group" }
              : {
                  id: msg.sender.id,
                  name: msg.sender.username,
                  type: msg.sender.role,
                },
          last_message: {
            preview:
              msg.content.text || (msg.content.image ? "[Image]" : "[File]"),
            timestamp: msg.timestamp,
          },
          unread_count: 1,
        };

        if (existingNotificationIndex > -1) {
          const existing = newNotifications[existingNotificationIndex];
          existing.unread_count += 1;
          existing.last_message = newNotificationData.last_message;
          // Move to top
          newNotifications.splice(existingNotificationIndex, 1);
          newNotifications.unshift(existing);
        } else {
          newNotifications.unshift(newNotificationData);
        }
        return newNotifications;
      });
    },
    [user, activeConversationId, sendMessage]
  );

  useEffect(() => {
    if (lastEvent && lastEvent.sender) {
      // A simple check for a message event
      handleNewMessage(lastEvent);
    }
  }, [lastEvent, handleNewMessage]);

  // 3. Clear Notifications when a chat is opened
  const clearUnreadCount = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        `${n.conversation_details.type}-${n.conversation_details.id}` === id
          ? { ...n, unread_count: 0 }
          : n
      )
    );
  };

  const totalUnreadCount = notifications.reduce(
    (sum, n) => sum + n.unread_count,
    0
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeConversationId,
        setActiveConversationId,
        clearUnreadCount,
        totalUnreadCount,
      }}
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
