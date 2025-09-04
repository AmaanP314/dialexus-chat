// // --- src/components/ConversationItem.tsx ---
// import React from "react";
// import { format, isToday, isYesterday } from "date-fns";
// import Avatar from "./Avatar";
// import { Conversation } from "./types";
// import { usePresence } from "@/context/PresenceContext";

// interface ConversationItemProps {
//   conversation: Conversation;
//   isSelected: boolean;
//   onClick: () => void;
// }

// const formatTimestamp = (timestamp: string): string => {
//   const date = new Date(timestamp);
//   if (isToday(date)) return format(date, "HH:mm");
//   if (isYesterday(date)) return "Yesterday";
//   return format(date, "dd/MM/yyyy");
// };

// const ConversationItem: React.FC<ConversationItemProps> = ({
//   conversation,
//   isSelected,
//   onClick,
// }) => {
//   const { presence } = usePresence();
//   const userKey = `${conversation.type}-${conversation.id}`;
//   const isOnline = presence[userKey]?.status === "online";
//   return (
//     <div
//       onClick={onClick}
//       className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
//         isSelected ? "bg-muted" : "hover:bg-muted/50"
//       }`}
//     >
//       <Avatar name={conversation.name} isOnline={isOnline} />
//       <div className="flex-grow ml-4 overflow-hidden">
//         <div className="flex items-center justify-between">
//           <h3 className="font-semibold text-foreground truncate">
//             {conversation.name}
//           </h3>
//           <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
//             {formatTimestamp(conversation.timestamp)}
//           </p>
//         </div>
//         <p className="text-sm text-muted-foreground truncate">
//           {conversation.last_message}
//         </p>
//       </div>
//     </div>
//   );
// };
// export default ConversationItem; // Already exported above

import React from "react";
import { Conversation } from "./types";
import Avatar from "./Avatar";
import { usePresence } from "@/context/PresenceContext";
import { useNotification } from "@/context/NotificationContext";
import { formatTimestampIST } from "@/lib/utils";

const ConversationItem: React.FC<{
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ conversation, isSelected, onClick }) => {
  const { presence } = usePresence();
  const { notifications } = useNotification();

  const conversationId = `${conversation.type}-${conversation.id}`;
  const isOnline = presence[conversationId]?.status === "online";

  // Find this conversation in the global notifications list to get its unread count
  const notification = notifications.find(
    (n) =>
      `${n.conversation_details.type}-${n.conversation_details.id}` ===
      conversationId
  );
  const unreadCount = notification?.unread_count || 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer ${
        isSelected ? "bg-muted" : "hover:bg-muted/50"
      }`}
    >
      <Avatar name={conversation.name} isOnline={isOnline} />
      <div className="flex-grow ml-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">
            {conversation.name}
          </h3>
          <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatTimestampIST(conversation.timestamp)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {conversation.last_message}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
export default ConversationItem;
