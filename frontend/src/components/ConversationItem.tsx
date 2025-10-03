// --- src/components/ConversationItem.tsx ---
import React from "react";
// import { format, isToday, isYesterday } from "date-fns";
import { formatConversationTimestamp } from "@/lib/utils";
import Avatar from "./Avatar";
import { Conversation } from "./types";
import { usePresence } from "@/context/PresenceContext";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

// const formatTimestamp = (timestamp: string): string => {
//   const date = new Date(timestamp);
//   if (isToday(date)) return format(date, "HH:mm");
//   if (isYesterday(date)) return "Yesterday";
//   return format(date, "dd/MM/yyyy");
// };

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const { user } = useAuth();
  const { presence } = usePresence();
  const { unreadCounts } = useNotification();
  const userKey = `${conversation.type}-${conversation.id}`;
  const isOnline = presence[userKey]?.status === "online";
  const unreadCount = unreadCounts.get(userKey) || 0;
  const isAdmin = user?.type === "admin" || user?.type === "super_admin";

  return (
    <div
      onClick={onClick}
      // UI Enhancement: Stronger selection color, better hover
      className={`flex items-center p-4 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0 ${
        isSelected ? "bg-primary/10" : "hover:bg-accent/50"
      }`}
    >
      {/* Keeping your fix: Avatar is protected from shrinking */}
      <Avatar
        name={conversation.name}
        isOnline={isOnline}
        className="flex-shrink-0"
      />

      <div className="flex-grow ml-4 overflow-hidden">
        <div className="flex items-center justify-between">
          {/* UI Enhancement: Bolder, slightly larger name */}
          <h3 className="font-bold text-base text-foreground truncate">
            {conversation.full_name || conversation.name}
          </h3>
          {/* <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatTimestamp(conversation.timestamp)}
          </p> */}
          <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {/* --- MODIFICATION START --- */}
            {formatConversationTimestamp(conversation.timestamp)}
            {/* --- MODIFICATION END --- */}
          </p>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.last_message_is_deleted && !isAdmin ? (
              <span className="italic">This message was deleted</span>
            ) : (
              conversation.last_message
            )}
          </p>

          {unreadCount > 0 && (
            // UI Enhancement: Navy bright blue badge
            <span
              className="ml-3 flex-shrink-0 bg-[#0070f3] text-white text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
              style={{ minWidth: "20px" }} // Ensures badge doesn't collapse
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
