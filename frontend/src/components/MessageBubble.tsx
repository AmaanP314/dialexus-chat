// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { formatTimestampIST } from "@/lib/utils";
// import { format } from "date-fns";
// import { Message } from "./types";
// import MessageStatus from "./MessageStatus";
// import Avatar from "./Avatar";
// import { FileAttachmentDisplay } from "./FileAttachmentDisplay";
// import { ImageModal } from "./ImageModal";
// import { useAuth } from "@/context/AuthContext"; // <-- IMPORT useAuth
// import { MoreVertical, Trash2 } from "lucide-react";

// interface MessageBubbleProps {
//   message: Message;
//   isSentByCurrentUser: boolean;
//   isGroupMessage: boolean;
// }

// const MessageBubble: React.FC<MessageBubbleProps> = ({
//   message,
//   isSentByCurrentUser,
//   isGroupMessage,
// }) => {
//   // const [isModalOpen, setIsModalOpen] = useState(false);
//   const { user } = useAuth(); // <-- GET USER
//   const isAdmin = user?.type === "admin" || user?.type === "super_admin";

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   // const [showDeleteOption, setShowDeleteOption] = useState(true);
//   const [showDeleteMenu, setShowDeleteMenu] = useState(false); // <-- STATE FOR MENU
//   const menuRef = useRef<HTMLDivElement>(null);

//   // Determine alignment and color
//   const bubbleColor = isSentByCurrentUser
//     ? "bg-bubble-sent"
//     : "bg-bubble-received";
//   const alignmentClasses = isSentByCurrentUser ? "items-end" : "items-start";
//   const nameOrderClasses = isSentByCurrentUser ? "flex-row-reverse" : "";

//   const hasAttachment = message.content.image || message.content.file;
//   const hasText = message.content.text && message.content.text.trim() !== "";

//   const getFileNameFromUrl = (url: string) =>
//     decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");

//   // Show sender info only if it's a group message and not sent by the current user
//   const showSenderInfo = isGroupMessage && !isSentByCurrentUser;

//   if (message.is_deleted && !isAdmin) {
//     // 1. Determine if we should display the Avatar/Username
//     //    Show only if it's a group message AND NOT sent by the current user.
//     const showDeletedSenderInfo = isGroupMessage && !isSentByCurrentUser;

//     // 2. Determine Bubble Color for the deleted message
//     //    If sent by current user, use the 'sent' color, otherwise use 'muted' (grey)
//     const deletedBubbleColor = isSentByCurrentUser
//       ? "bg-bubble-sent"
//       : "bg-muted";

//     // 3. Determine Alignment and Order Classes (same as main logic)
//     const deletedAlignmentClasses = isSentByCurrentUser
//       ? "items-end"
//       : "items-start";
//     const deletedNameOrderClasses = isSentByCurrentUser
//       ? "flex-row-reverse"
//       : "";

//     return (
//       <div className={`flex flex-col ${deletedAlignmentClasses} mb-2`}>
//         {/* AVATAR AND USERNAME - Displayed only if it's a group message AND not sent by the current user */}
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

//         {/* Message Bubble Container - Add indentation only when sender info is shown */}
//         <div className={showDeletedSenderInfo ? "ml-10 " : ""}>
//           <div
//             // Use the determined deletedBubbleColor here
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
//               {formatTimestampIST(message.timestamp)}
//               {/* Optional: Add a checkmark/status for self-sent deleted messages if applicable */}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className={`flex flex-col ${alignmentClasses} mb-2`}>
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
//         {/* *** CORRECTED: Added a container with margin for indentation *** */}
//         <div className={showSenderInfo ? "ml-10 " : ""}>
//           <div
//             className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor} shadow-md`}
//           >
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
//                 {message.content.text}
//               </p>
//             )}
//             <div className="flex items-center justify-end mt-1">
//               {isAdmin && message.is_deleted && (
//                 <span className="text-xs text-red-400 italic mr-2">
//                   (Deleted)
//                 </span>
//               )}
//               <span className="text-xs text-muted-foreground/80">
//                 {/* {format(new Date(message.timestamp), "HH:mm")} */}
//                 {formatTimestampIST(message.timestamp)}
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
import { formatTimestampIST } from "@/lib/utils";
import { format } from "date-fns";
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
  onDelete?: (messageId: string) => void; // Add this prop
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSentByCurrentUser,
  isGroupMessage,
  onDelete, // Add this
}) => {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin" || user?.type === "super_admin";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  // Render deleted message
  if (message.is_deleted && !isAdmin) {
    const showDeletedSenderInfo = isGroupMessage && !isSentByCurrentUser;
    const deletedBubbleColor = isSentByCurrentUser
      ? "bg-bubble-sent"
      : "bg-muted";
    const deletedAlignmentClasses = isSentByCurrentUser
      ? "items-end"
      : "items-start";
    const deletedNameOrderClasses = isSentByCurrentUser
      ? "flex-row-reverse"
      : "";

    return (
      <div className={`flex flex-col ${deletedAlignmentClasses} mb-2`}>
        {showDeletedSenderInfo && (
          <div
            className={`flex items-center gap-2 mb-1 ${deletedNameOrderClasses}`}
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
              {formatTimestampIST(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
            className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor} shadow-md`}
          >
            {/* Three dots menu - only show for messages sent by current user */}
            {isSentByCurrentUser && (
              <div
                className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                ref={menuRef}
              >
                <button
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-1 rounded-full hover:bg-muted"
                  aria-label="Message options"
                >
                  <MoreVertical size={16} className="text-muted-foreground" />
                </button>

                {/* Delete dropdown menu */}
                {showDeleteMenu && (
                  <div className="absolute right-0 mt-1 bg-background rounded-lg shadow-lg border border-border py-1 w-36 z-10">
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      Delete Message
                    </button>
                  </div>
                )}
              </div>
            )}

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
                {message.content.text}
              </p>
            )}
            <div className="flex items-center justify-end mt-1">
              {isAdmin && message.is_deleted && (
                <span className="text-xs text-red-400 italic mr-2">
                  (Deleted)
                </span>
              )}
              <span className="text-xs text-muted-foreground/80">
                {formatTimestampIST(message.timestamp)}
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
