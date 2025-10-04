// "use client";

// import React, { useState, useEffect, useRef } from "react";
// // import { formatTimestampIST } from "@/lib/utils";
// import { formatMessageTimestamp } from "@/lib/utils";
// import { format } from "date-fns";
// import { Message } from "./types";
// import MessageStatus from "./MessageStatus";
// import Avatar from "./Avatar";
// import { FileAttachmentDisplay } from "./FileAttachmentDisplay";
// import { ImageModal } from "./ImageModal";
// import { useAuth } from "@/context/AuthContext";
// import { MoreVertical, Trash2 } from "lucide-react";

// interface MessageBubbleProps {
//   message: Message;
//   isSentByCurrentUser: boolean;
//   isGroupMessage: boolean;
//   onDelete?: (messageId: string) => void; // Add this prop
// }
// const CHAR_LIMIT = 400;
// const MessageBubble: React.FC<MessageBubbleProps> = ({
//   message,
//   isSentByCurrentUser,
//   isGroupMessage,
//   onDelete, // Add this
// }) => {
//   const { user } = useAuth();
//   const isAdmin = user?.type === "admin" || user?.type === "super_admin";

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [showDeleteMenu, setShowDeleteMenu] = useState(false);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);

//   // Close menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setShowDeleteMenu(false);
//       }
//     };

//     if (showDeleteMenu) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showDeleteMenu]);

//   const bubbleColor = isSentByCurrentUser
//     ? "bg-bubble-sent"
//     : "bg-bubble-received";
//   const alignmentClasses = isSentByCurrentUser ? "items-end" : "items-start";
//   const nameOrderClasses = isSentByCurrentUser ? "flex-row-reverse" : "";

//   const hasAttachment = message.content.image || message.content.file;
//   // const hasText = message.content.text && message.content.text.trim() !== "";
//   const hasText = message.content.text && message.content.text.trim() !== "";
//   const isLongMessage = hasText && message.content.text!.length > CHAR_LIMIT;

//   const getFileNameFromUrl = (url: string) =>
//     decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");

//   const showSenderInfo = isGroupMessage && !isSentByCurrentUser;

//   // Handle delete
//   const handleDeleteClick = () => {
//     if (onDelete) {
//       onDelete(message._id);
//     }
//     setShowDeleteMenu(false);
//   };

//   // Render deleted message
//   if (message.is_deleted && !isAdmin) {
//     const showDeletedSenderInfo = isGroupMessage && !isSentByCurrentUser;
//     const deletedBubbleColor = isSentByCurrentUser
//       ? "bg-bubble-sent"
//       : "bg-muted";
//     const deletedAlignmentClasses = isSentByCurrentUser
//       ? "items-end"
//       : "items-start";
//     const deletedNameOrderClasses = isSentByCurrentUser
//       ? "flex-row-reverse"
//       : "";

//     return (
//       <div className={`flex flex-col ${deletedAlignmentClasses} mb-2`}>
//         {showDeletedSenderInfo && (
//           <div
//             className={`flex items-center gap-2 mb-1 ${deletedNameOrderClasses}`}
//           >
//             <Avatar
//               name={message.sender.username}
//               className="w-8 h-8 text-xs"
//             />
//             <span className="text-sm font-semibold text-muted-foreground">
//               {message.sender.username}
//             </span>
//           </div>
//         )}

//         <div className={showDeletedSenderInfo ? "ml-10 " : ""}>
//           <div
//             className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${deletedBubbleColor} shadow-md`}
//           >
//             <p
//               className={`text-sm italic ${
//                 isSentByCurrentUser ? "text-white/80" : "text-muted-foreground"
//               }`}
//             >
//               This message was deleted
//             </p>
//             <div
//               className={`text-right text-xs ${
//                 isSentByCurrentUser
//                   ? "text-white/60"
//                   : "text-muted-foreground/80"
//               } mt-1`}
//             >
//               {formatMessageTimestamp(message.timestamp)}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   return (
//     <>
//       <div className={`flex flex-col ${alignmentClasses} mb-2 group`}>
//         {showSenderInfo && (
//           <div className={`flex items-center gap-2 mb-1 ${nameOrderClasses}`}>
//             <Avatar
//               name={message.sender.username}
//               className="w-8 h-8 text-xs"
//             />
//             <span className="text-sm font-semibold text-muted-foreground">
//               {message.sender.username}
//             </span>
//           </div>
//         )}

//         <div className={`${showSenderInfo ? "ml-10" : ""} relative`}>
//           <div
//             className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor} shadow-md relative`}
//           >
//             {isSentByCurrentUser && (
//               <div
//                 className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
//                 ref={menuRef}
//               >
//                 <button
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     setShowDeleteMenu((prev) => !prev);
//                   }}
//                   className="p-1 rounded-full bg-background/80 hover:bg-background shadow-sm border border-transparent hover:border-border"
//                   aria-label="Message options"
//                 >
//                   <MoreVertical size={16} className="text-muted-foreground" />
//                 </button>

//                 {/* Delete dropdown menu */}
//                 {showDeleteMenu && (
//                   <div
//                     className="absolute right-0 mt-1 rounded-lg shadow-lg border border-border py-1 w-36 z-30"
//                     onClick={(e) => e.stopPropagation()}
//                   >
//                     <button
//                       onClick={handleDeleteClick}
//                       className="w-full px-2 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
//                     >
//                       <Trash2 size={14} />
//                       Delete
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {hasAttachment && (
//               <div className="mb-2">
//                 {message.content.image && (
//                   <img
//                     src={message.content.image}
//                     alt="Attachment"
//                     className="rounded-lg max-w-xs cursor-pointer"
//                     onClick={() => setIsModalOpen(true)}
//                   />
//                 )}
//                 {message.content.file && (
//                   <FileAttachmentDisplay
//                     fileUrl={message.content.file}
//                     fileName={getFileNameFromUrl(message.content.file)}
//                   />
//                 )}
//               </div>
//             )}
//             {hasText && (
//               <p className="text-foreground text-sm whitespace-pre-wrap break-words">
//                 {isLongMessage && !isExpanded
//                   ? `${message.content.text!.substring(0, CHAR_LIMIT)}... `
//                   : message.content.text}
//                 {isLongMessage && !isExpanded && (
//                   <button
//                     onClick={() => setIsExpanded(true)}
//                     className="text-blue-400 hover:underline text-sm font-semibold"
//                   >
//                     read more
//                   </button>
//                 )}
//               </p>
//             )}
//             <div className="flex items-center justify-end mt-1">
//               {isAdmin && message.is_deleted && (
//                 <span className="text-xs text-red-400 italic mr-2">
//                   (Deleted)
//                 </span>
//               )}
//               <span className="text-xs text-muted-foreground/80">
//                 {formatMessageTimestamp(message.timestamp)}
//               </span>
//               {isSentByCurrentUser && <MessageStatus status={message.status} />}
//             </div>
//           </div>
//         </div>
//       </div>

//       {isModalOpen && message.content.image && (
//         <ImageModal
//           imageUrl={message.content.image}
//           onClose={() => setIsModalOpen(false)}
//         />
//       )}
//     </>
//   );
// };

// export default MessageBubble;

"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatMessageTimestamp } from "@/lib/utils";
import { Message } from "./types";
import MessageStatus from "./MessageStatus";
import Avatar from "./Avatar";
import { FileAttachmentDisplay } from "./FileAttachmentDisplay";
import { ImageModal } from "./ImageModal";
import { useAuth } from "@/context/AuthContext";
import { MoreVertical, Trash2 } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isSentByCurrentUser: boolean;
  isGroupMessage: boolean;
  onDelete?: (messageId: string) => void;
}
const CHAR_LIMIT = 400;

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSentByCurrentUser,
  isGroupMessage,
  onDelete,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin" || user?.type === "super_admin";

  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for menu visibility, controlled by click
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (still necessary for click-to-open)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false);
      }
    };

    if (showDeleteMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteMenu]);

  const bubbleColor = isSentByCurrentUser
    ? "bg-bubble-sent"
    : "bg-bubble-received";
  const alignmentClasses = isSentByCurrentUser ? "items-end" : "items-start";
  const nameOrderClasses = isSentByCurrentUser ? "flex-row-reverse" : "";

  const hasAttachment = message.content.image || message.content.file;
  const hasText = message.content.text && message.content.text.trim() !== "";
  const isLongMessage = hasText && message.content.text!.length > CHAR_LIMIT;

  const getFileNameFromUrl = (url: string) =>
    decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");

  const showSenderInfo = isGroupMessage && !isSentByCurrentUser;

  // Handle delete
  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(message._id);
    }
    setShowDeleteMenu(false);
  };

  // Omitted deleted message render for brevity

  if (message.is_deleted && !isAdmin) {
    const showDeletedSenderInfo = isGroupMessage && !isSentByCurrentUser;
    const deletedBubbleColor = isSentByCurrentUser
      ? "bg-bubble-sent"
      : "bg-muted";
    const deletedAlignmentClasses = isSentByCurrentUser
      ? "items-end"
      : "items-start";

    return (
      <div className={`flex flex-col ${deletedAlignmentClasses} mb-2`}>
        {showDeletedSenderInfo && (
          <div
            className={`flex items-center gap-2 mb-1 ${
              isSentByCurrentUser ? "flex-row-reverse" : ""
            }`}
          >
            <Avatar
              name={message.sender.username}
              className="w-8 h-8 text-xs"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              {message.sender.username}
            </span>
          </div>
        )}

        <div className={showDeletedSenderInfo ? "ml-10 " : ""}>
          <div
            className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${deletedBubbleColor} shadow-md`}
          >
            <p
              className={`text-sm italic ${
                isSentByCurrentUser ? "text-white/80" : "text-muted-foreground"
              }`}
            >
              This message was deleted
            </p>
            <div
              className={`text-right text-xs ${
                isSentByCurrentUser
                  ? "text-white/60"
                  : "text-muted-foreground/80"
              } mt-1`}
            >
              {formatMessageTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* The outer div is the group hover parent */}
      <div className={`flex flex-col ${alignmentClasses} mb-2 group`}>
        {showSenderInfo && (
          <div className={`flex items-center gap-2 mb-1 ${nameOrderClasses}`}>
            <Avatar
              name={message.sender.username}
              className="w-8 h-8 text-xs"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              {message.sender.username}
            </span>
          </div>
        )}

        <div className={`${showSenderInfo ? "ml-10" : ""} relative`}>
          <div
            className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor} shadow-md relative`}
          >
            {/* Options Menu Container (Click-to-open logic restored) */}
            {isSentByCurrentUser && !message.is_deleted && (
              <div
                // Positioned absolutely outside the bubble, centered vertically
                className={`absolute ${
                  isSentByCurrentUser ? "left-[-32px]" : "right-[-32px]"
                } top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20`}
                ref={menuRef}
                // *** REMOVED: onMouseEnter and onMouseLeave handlers ***
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // *** ACTION: Toggles menu visibility on click ***
                    setShowDeleteMenu((prev) => !prev);
                  }}
                  // No background/hover background, small padding, hover text color for feedback
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary/50"
                  aria-label="Message options"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Delete dropdown menu */}
                {showDeleteMenu && (
                  <div
                    // Positioned relative to the button
                    className={`absolute ${
                      isSentByCurrentUser ? "right-0" : "left-0"
                    } mt-1 rounded-md shadow-lg border border-border bg-background py-1 w-36 z-30`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDeleteClick}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                      role="menuitem"
                    >
                      <Trash2 size={14} className="flex-shrink-0" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Message Content */}
            {hasAttachment && (
              <div className="mb-2">
                {message.content.image && (
                  <img
                    src={message.content.image}
                    alt="Attachment"
                    className="rounded-lg max-w-xs cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  />
                )}
                {message.content.file && (
                  <FileAttachmentDisplay
                    fileUrl={message.content.file}
                    fileName={getFileNameFromUrl(message.content.file)}
                  />
                )}
              </div>
            )}

            {hasText && (
              <p className="text-foreground text-sm whitespace-pre-wrap break-words">
                {isLongMessage && !isExpanded
                  ? `${message.content.text!.substring(0, CHAR_LIMIT)}... `
                  : message.content.text}
                {isLongMessage && !isExpanded && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-blue-400 hover:underline text-sm font-semibold"
                  >
                    read more
                  </button>
                )}
              </p>
            )}

            {/* Timestamp and Status */}
            <div className="flex items-center justify-end mt-1">
              {isAdmin && message.is_deleted && (
                <span className="text-xs text-red-400 italic mr-2">
                  (Deleted)
                </span>
              )}
              <span className="text-xs text-muted-foreground/80">
                {formatMessageTimestamp(message.timestamp)}
              </span>
              {isSentByCurrentUser && <MessageStatus status={message.status} />}
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && message.content.image && (
        <ImageModal
          imageUrl={message.content.image}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
};

export default MessageBubble;
