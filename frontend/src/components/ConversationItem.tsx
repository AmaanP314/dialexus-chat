// // --- src/components/ConversationItem.tsx ---
// import React, { useState, useRef, useEffect } from "react";
// import { MoreVertical, Pin } from "lucide-react";
// // import { format, isToday, isYesterday } from "date-fns";
// import { formatConversationTimestamp } from "@/lib/utils";
// import Avatar from "./Avatar";
// import { Conversation as BaseConversation } from "./types";
// import { usePresence } from "@/context/PresenceContext";
// import { useNotification } from "@/context/NotificationContext";
// import { useAuth } from "@/context/AuthContext";

// interface Conversation extends BaseConversation {
//   is_pinned?: boolean;
// }

// interface ConversationItemProps {
//   conversation: Conversation;
//   isSelected: boolean;
//   onClick: () => void;
//   onTogglePin: (conversation: Conversation) => void;
// }

// const ConversationItem: React.FC<ConversationItemProps> = ({
//   conversation,
//   isSelected,
//   onClick,
//   onTogglePin,
// }) => {
//   const { user } = useAuth();
//   const { presence } = usePresence();
//   const { unreadCounts } = useNotification();
//   const userKey = `${conversation.type}-${conversation.id}`;
//   const isOnline = presence[userKey]?.status === "online";
//   const unreadCount = unreadCounts.get(userKey) || 0;
//   const isAdmin = user?.type === "admin" || user?.type === "super_admin";

//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setIsMenuOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const handleTogglePin = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     onTogglePin(conversation);
//     setIsMenuOpen(false);
//   };

//   const handleMenuClick = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsMenuOpen((prev) => !prev);
//   };

//   return (
//     <div
//       onClick={onClick}
//       // UI Enhancement: Stronger selection color, better hover
//       className={`flex items-center p-4 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0 ${
//         isSelected ? "bg-primary/10" : "hover:bg-accent/50"
//       }`}
//     >
//       {/* Keeping your fix: Avatar is protected from shrinking */}
//       <Avatar
//         name={conversation.name}
//         isOnline={isOnline}
//         className="flex-shrink-0"
//       />

//       <div className="flex-grow ml-4 overflow-hidden">
//         <div className="flex items-center justify-between">
//           {/* UI Enhancement: Bolder, slightly larger name */}
//           <div className="flex items-center min-w-0">
//             <h3 className="font-bold text-base text-foreground truncate">
//               {conversation.full_name || conversation.name}
//             </h3>
//             {conversation.is_pinned && (
//               <Pin
//                 size={14}
//                 className="ml-2 text-muted-foreground flex-shrink-0"
//               />
//             )}
//           </div>
//           {/* <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
//             {formatTimestamp(conversation.timestamp)}
//           </p> */}
//           <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
//             {/* --- MODIFICATION START --- */}
//             {formatConversationTimestamp(conversation.timestamp)}
//             {/* --- MODIFICATION END --- */}
//           </p>
//         </div>

//         <div className="flex items-center justify-between mt-1">
//           <p className="text-sm text-muted-foreground truncate">
//             {conversation.last_message_is_deleted && !isAdmin ? (
//               <span className="italic">This message was deleted</span>
//             ) : (
//               conversation.last_message
//             )}
//           </p>

//           {unreadCount > 0 && (
//             // UI Enhancement: Navy bright blue badge
//             <span
//               className="ml-3 flex-shrink-0 bg-[#0070f3] text-white text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
//               style={{ minWidth: "20px" }} // Ensures badge doesn't collapse
//             >
//               {unreadCount}
//             </span>
//           )}
//         </div>
//       </div>
//       <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
//         <button
//           onClick={handleMenuClick}
//           className="p-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
//           aria-label="Conversation options"
//         >
//           <MoreVertical size={20} />
//         </button>
//         {isMenuOpen && (
//           <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
//             <button
//               onClick={handleTogglePin}
//               className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2"
//             >
//               <Pin size={14} />
//               {conversation.is_pinned
//                 ? "Unpin Conversation"
//                 : "Pin Conversation"}
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ConversationItem;

// --- src/components/ConversationItem.tsx ---
import React, { useState, useRef, useEffect } from "react";
import { MoreVertical, Pin, User, ShieldCheck, Users } from "lucide-react";
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
  onTogglePin: (conversation: Conversation) => void;
}

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

  // Helper component to determine the icon based on conversation type
  const ConversationTypeIcon = () => {
    const iconSize = 18;
    const iconClass = "ml-2 text-primary flex-shrink-0"; // Use 'text-primary' for visibility

    switch (conversation.type) {
      case "admin":
        return (
          <ShieldCheck
            size={iconSize}
            className={iconClass}
            aria-label="Admin Conversation"
          />
        );
      case "group":
        return (
          <Users
            size={iconSize}
            className={iconClass}
            aria-label="Group Conversation"
          />
        );
      case "user":
      default:
        // You might decide to show nothing for 'user' or a User icon
        return (
          <User
            size={iconSize}
            className={iconClass + " opacity-50"} // Making the 'user' icon less prominent
            aria-label="User Conversation"
          />
        );
    }
  };

  return (
    <div
      onClick={onClick}
      // Added 'relative' here to make the absolute positioning of the menu work correctly
      className={`group flex items-center p-4 cursor-pointer transition-colors duration-200 border-b border-border/50 last:border-b-0 relative ${
        isSelected ? "bg-primary/10" : "hover:bg-accent/50"
      }`}
    >
      {/* 1. Avatar */}
      <Avatar
        name={conversation.name}
        isOnline={isOnline}
        className="flex-shrink-0"
      />

      {/* 2. Content Area (Grows to fill space) */}
      <div className="flex-grow ml-4 overflow-hidden">
        {/* Top Row: Name and Timestamp */}
        <div className="flex items-start justify-between">
          <div className="flex items-center min-w-0 pr-4">
            <h3 className="font-bold text-base text-foreground truncate">
              {conversation.full_name || conversation.name}
            </h3>
            {/* START: Added Conversation Type Icon */}
            <ConversationTypeIcon />
            {/* END: Added Conversation Type Icon */}
            {conversation.is_pinned && (
              <Pin
                size={14}
                className="ml-2 text-muted-foreground flex-shrink-0"
                aria-label="Pinned conversation"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground flex-shrink-0">
            {formatConversationTimestamp(conversation.timestamp)}
          </p>
        </div>

        {/* Bottom Row: Last Message and Unread Badge */}
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground truncate">
            {conversation.last_message_is_deleted && !isAdmin ? (
              <span className="italic">This message was deleted</span>
            ) : (
              conversation.last_message
            )}
          </p>

          {unreadCount > 0 && (
            <span
              className="ml-3 flex-shrink-0 bg-[#0070f3] text-white text-xs font-extrabold w-5 h-5 flex items-center justify-center rounded-full shadow-md"
              style={{ minWidth: "20px" }}
              aria-label={`${unreadCount} unread messages`}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* 3. Options Menu (COMPACT ABSOLUTE POSITIONING) */}
      {/* MODIFICATION: Absolute position over the right padding. 
         This reserves NO extra space in the flex flow.
      */}
      <div
        ref={menuRef}
        // Positioned absolutely over the right padding (p-4).
        // top-1/2 and -translate-y-1/2 center it vertically.
        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150 z-20 ${
          isMenuOpen || isSelected
            ? "opacity-100"
            : // On hover, we show it, but we also ensure its presence doesn't cause content reflow
              "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleMenuClick}
          // Use p-1 for a smaller hit area if needed, but p-2 is good for UX.
          // Using -mr-2 pulls it flush with the right edge.
          className="p-2 -mr-2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none"
          aria-label="Conversation options"
        >
          <MoreVertical size={20} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-30">
            <button
              onClick={handleTogglePin}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2"
              role="menuitem"
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
