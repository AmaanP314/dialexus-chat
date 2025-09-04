// "use client";

// import React, { useState, useEffect } from "react";
// import { Search } from "lucide-react";
// import { useAuth } from "@/context/AuthContext";
// import UserProfile from "./UserProfile";
// import ConversationList from "./ConversationList";
// import { searchAll } from "@/lib/api";
// import {
//   SearchResults,
//   Conversation,
//   SearchResultUser,
//   SearchResultAdmin,
//   SearchResultGroup,
// } from "./types";
// import Avatar from "./Avatar";

// const useDebounce = (value: string, delay: number) => {
//   const [debouncedValue, setDebouncedValue] = useState(value);
//   useEffect(() => {
//     const handler = setTimeout(() => setDebouncedValue(value), delay);
//     return () => clearTimeout(handler);
//   }, [value, delay]);
//   return debouncedValue;
// };

// interface SidebarProps {
//   conversations: Conversation[];
//   onConversationSelect: (conversation: Conversation) => void;
//   selectedConversationId?: number | null;
// }

// const Sidebar: React.FC<SidebarProps> = ({
//   conversations,
//   onConversationSelect,
//   selectedConversationId,
// }) => {
//   const [query, setQuery] = useState("");
//   const [results, setResults] = useState<SearchResults | null>(null);
//   const [isSearching, setIsSearching] = useState(false);
//   const debouncedQuery = useDebounce(query, 300);
//   const { user } = useAuth(); // Use the user object as the auth signal

//   // --- CORRECTED: Search is now triggered by the user object ---
//   useEffect(() => {
//     if (debouncedQuery && user) {
//       // Check for user, not token
//       setIsSearching(true);
//       searchAll(debouncedQuery) // No token needed
//         .then((data) => {
//           setResults(data);
//         })
//         .finally(() => {
//           setIsSearching(false);
//         });
//     } else {
//       setResults(null);
//     }
//   }, [debouncedQuery, user]); // Dependency is now `user`

//   const handleSearchSelect = (
//     item: SearchResultUser | SearchResultAdmin | SearchResultGroup
//   ) => {
//     const conversationType =
//       "name" in item ? "group" : (item.type.toLowerCase() as "user" | "admin");
//     const conversation: Conversation = {
//       id: item.id,
//       name: "name" in item ? item.name : item.username,
//       type: conversationType,
//       last_message: `Start a conversation with ${
//         "name" in item ? item.name : item.username
//       }`,
//       timestamp: new Date().toISOString(),
//     };
//     setQuery("");
//     setResults(null);
//     onConversationSelect(conversation);
//   };

//   return (
//     <aside className="w-full md:w-1/3 lg:w-1/4 h-screen bg-background border-r border-border flex flex-col">
//       <UserProfile />
//       <div className="p-4 bg-background border-b border-border">
//         <div className="relative">
//           <Search
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//             size={20}
//           />
//           <input
//             type="text"
//             placeholder="Search or start new chat"
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
//           />
//         </div>
//       </div>
//       <div className="flex-grow overflow-y-auto">
//         {query ? (
//           <div className="p-2">
//             {isSearching && (
//               <p className="text-muted-foreground text-center p-4">
//                 Searching...
//               </p>
//             )}
//             {results && (
//               <>
//                 {results.users.map((u) => (
//                   <SearchResultItem
//                     key={`user-${u.id}`}
//                     name={u.username}
//                     type="User"
//                     onClick={() => handleSearchSelect(u)}
//                   />
//                 ))}
//                 {results.admins.map((a) => (
//                   <SearchResultItem
//                     key={`admin-${a.id}`}
//                     name={a.username}
//                     type="Admin"
//                     onClick={() => handleSearchSelect(a)}
//                   />
//                 ))}
//                 {results.groups.map((g) => (
//                   <SearchResultItem
//                     key={`group-${g.id}`}
//                     name={g.name}
//                     type="Group"
//                     onClick={() => handleSearchSelect(g)}
//                   />
//                 ))}
//               </>
//             )}
//           </div>
//         ) : (
//           <ConversationList
//             conversations={conversations}
//             onConversationSelect={onConversationSelect}
//             selectedConversationId={selectedConversationId}
//           />
//         )}
//       </div>
//     </aside>
//   );
// };

// const SearchResultItem = ({
//   name,
//   type,
//   onClick,
// }: {
//   name: string;
//   type: string;
//   onClick: () => void;
// }) => (
//   <div
//     onClick={onClick}
//     className="flex items-center p-3 cursor-pointer hover:bg-muted/50 rounded-lg"
//   >
//     <Avatar name={name} />
//     <div className="ml-4">
//       <h3 className="font-semibold text-foreground">{name}</h3>
//       <p className="text-sm text-muted-foreground">{type}</p>
//     </div>
//   </div>
// );

// export default Sidebar;

"use client";
import { LogOut, Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Conversation, Notification } from "./types";
import UserProfile from "./UserProfile";
import ConversationList from "./ConversationList";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotification } from "@/context/NotificationContext";
import Avatar from "./Avatar";
import { formatTimestampIST } from "@/lib/utils";

// A sub-component for displaying a single notification item in the popover
const NotificationItem = ({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center p-3 hover:bg-muted/50 cursor-pointer"
  >
    <Avatar name={notification.conversation_details.name} />
    <div className="ml-4 flex-grow overflow-hidden">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold truncate">
          {notification.conversation_details.name}
        </h3>
        <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
          {formatTimestampIST(notification.last_message.timestamp)}
        </p>
      </div>
      <div className="flex justify-between items-center mt-1">
        <p className="text-sm text-muted-foreground truncate pr-2">
          {notification.last_message.preview}
        </p>
        {notification.unread_count > 0 && (
          <span className="flex-shrink-0 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notification.unread_count}
          </span>
        )}
      </div>
    </div>
  </div>
);

// The main Notification Bell component
const NotificationBell = ({
  onNotificationClick,
}: {
  onNotificationClick: (convo: any) => void;
}) => {
  const { notifications, totalUnreadCount } = useNotification();
  const unreadNotifications = notifications.filter((n) => n.unread_count > 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted">
          <Bell className="w-5 h-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center text-[10px]">
              {totalUnreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-lg">Notifications</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {unreadNotifications.length > 0 ? (
            unreadNotifications.map((n) => (
              <NotificationItem
                key={`${n.conversation_details.type}-${n.conversation_details.id}`}
                notification={n}
                onClick={() => onNotificationClick(n.conversation_details)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center p-4">
              No new notifications
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function Sidebar({
  conversations,
  onConversationSelect,
  selectedConversationId,
}: {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId: number | undefined;
}) {
  const { user, logout } = useAuth();

  const handleNotificationClick = (convoDetails: any) => {
    // We create a "Conversation-like" object to pass to the parent for selection
    const conversation: Conversation = {
      id: convoDetails.id,
      name: convoDetails.name,
      type: convoDetails.type,
      last_message: "", // These details aren't needed for the selection logic
      timestamp: "",
    };
    onConversationSelect(conversation);
    // The popover will close automatically after the click
  };

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 h-full flex flex-col bg-background border-r border-border">
      <header className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        {user && <UserProfile />}
        <div className="flex items-center gap-2">
          <NotificationBell onNotificationClick={handleNotificationClick} />
          <button
            onClick={() => logout()}
            className="p-2 rounded-full hover:bg-muted"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <ConversationList
        conversations={conversations}
        onConversationSelect={onConversationSelect}
        selectedConversationId={selectedConversationId}
      />
    </aside>
  );
}
