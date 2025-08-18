"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Message } from "./types";
import MessageStatus from "./MessageStatus";
import Avatar from "./Avatar";
import { FileAttachmentDisplay } from "./FileAttachmentDisplay";
import { ImageModal } from "./ImageModal"; // Adjust path if needed

interface MessageBubbleProps {
  message: Message;
  isSentByCurrentUser: boolean;
  isGroupMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSentByCurrentUser,
  isGroupMessage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Determine alignment and color
  const bubbleColor = isSentByCurrentUser
    ? "bg-bubble-sent"
    : "bg-bubble-received";
  const alignmentClasses = isSentByCurrentUser ? "items-end" : "items-start";
  const nameOrderClasses = isSentByCurrentUser ? "flex-row-reverse" : "";

  const hasAttachment = message.content.image || message.content.file;
  const hasText = message.content.text && message.content.text.trim() !== "";

  const getFileNameFromUrl = (url: string) =>
    decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");

  // Show sender info only if it's a group message and not sent by the current user
  const showSenderInfo = isGroupMessage && !isSentByCurrentUser;

  return (
    <>
      <div className={`flex flex-col ${alignmentClasses} mb-2`}>
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
        {/* *** CORRECTED: Added a container with margin for indentation *** */}
        <div className={showSenderInfo ? "ml-10 " : ""}>
          <div
            className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor} shadow-md`}
          >
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
              <span className="text-xs text-muted-foreground/80">
                {format(new Date(message.timestamp), "HH:mm")}
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
