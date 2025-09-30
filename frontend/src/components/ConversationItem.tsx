// --- src/components/ConversationItem.tsx ---
import React from "react";
import { format, isToday, isYesterday } from "date-fns";
import Avatar from "./Avatar";
import { Conversation } from "./types";
import { usePresence } from "@/context/PresenceContext";
import { useNotification } from "@/context/NotificationContext";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "dd/MM/yyyy");
};

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
}) => {
  const { presence } = usePresence();
  const { unreadCounts } = useNotification();
  const userKey = `${conversation.type}-${conversation.id}`;
  const isOnline = presence[userKey]?.status === "online";
  const unreadCount = unreadCounts.get(userKey) || 0;
  // return (
  //   <div
  //     onClick={onClick}
  //     className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
  //       isSelected ? "bg-muted" : "hover:bg-muted/50"
  //     }`}
  //   >
  //     <Avatar name={conversation.name} isOnline={isOnline} />
  //     <div className="flex-grow ml-4 overflow-hidden">
  //       <div className="flex items-center justify-between">
  //         <h3 className="font-semibold text-foreground truncate">
  //           {conversation.full_name || conversation.name}
  //         </h3>
  //         <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
  //           {formatTimestamp(conversation.timestamp)}
  //         </p>
  //       </div>
  //       <p className="text-sm text-muted-foreground truncate">
  //         {conversation.last_message}
  //       </p>
  //       {unreadCount > 0 && (
  //         <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
  //           {unreadCount}
  //         </span>
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
        isSelected ? "bg-muted" : "hover:bg-muted/50"
      }`}
    >
      <Avatar name={conversation.name} isOnline={isOnline} />
      <div className="flex-grow ml-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">
            {conversation.full_name || conversation.name}
          </h3>
          <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatTimestamp(conversation.timestamp)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.last_message}
          </p>
          {/* --- MODIFICATION START --- */}
          {/* Render badge only if there's an unread count */}
          {unreadCount > 0 && (
            <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default ConversationItem; // Already exported above
