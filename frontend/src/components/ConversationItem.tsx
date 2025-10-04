// --- src/components/ConversationItem.tsx ---
import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Pin } from "lucide-react";
// import { format, isToday, isYesterday } from "date-fns";
import { formatConversationTimestamp } from "@/lib/utils";
import Avatar from "./Avatar";
import { Conversation as BaseConversation } from "./types";
import { usePresence } from "@/context/PresenceContext";
import { useNotification } from "@/context/NotificationContext";
import { useAuth } from "@/context/AuthContext";

interface Conversation extends BaseConversation {
  is_pinned?: boolean;
}

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onTogglePin: (conversation: Conversation) => void;
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
  onTogglePin,
}) => {
  const { user } = useAuth();
  const { presence } = usePresence();
  const { unreadCounts } = useNotification();
  const userKey = `${conversation.type}-${conversation.id}`;
  const isOnline = presence[userKey]?.status === "online";
  const unreadCount = unreadCounts.get(userKey) || 0;
  const isAdmin = user?.type === "admin" || user?.type === "super_admin";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(conversation);
    setIsMenuOpen(false);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen((prev) => !prev);
  };

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
          <div className="flex items-center min-w-0">
            <h3 className="font-bold text-base text-foreground truncate">
              {conversation.full_name || conversation.name}
            </h3>
            {conversation.is_pinned && (
              <Pin
                size={14}
                className="ml-2 text-muted-foreground flex-shrink-0"
              />
            )}
          </div>
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
      <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Conversation options"
        >
          <MoreVertical size={20} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
            <button
              onClick={handleTogglePin}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2"
            >
              <Pin size={14} />
              {conversation.is_pinned
                ? "Unpin Conversation"
                : "Pin Conversation"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationItem;
