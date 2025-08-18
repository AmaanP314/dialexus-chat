import { Message } from "../types";
import Avatar from "../Avatar";
import { formatTimestampIST } from "@/lib/utils";
import { FileAttachmentDisplay } from "../FileAttachmentDisplay";
import { ImageModal } from "../ImageModal";
import { useState } from "react";

export default function AdminMessageBubble({
  message,
  userOneId,
}: {
  message: Message;
  userOneId: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Determine if the message is from "user one" of the pair for consistent alignment
  const isAlignedLeft = message.sender.id === userOneId;

  const bubbleColor = isAlignedLeft ? "bg-bubble-received" : "bg-bubble-sent";
  const alignmentClasses = isAlignedLeft ? "items-start" : "items-end";
  const nameOrderClasses = isAlignedLeft ? "" : "flex-row-reverse";

  const hasAttachment = message.content.image || message.content.file;
  const hasText = message.content.text && message.content.text.trim() !== "";
  const getFileNameFromUrl = (url: string) =>
    decodeURIComponent(new URL(url).pathname.split("/").pop() || "file");

  return (
    <>
      <div className={`flex flex-col ${alignmentClasses}`}>
        {/* Row for Avatar and Username */}
        <div className={`flex items-center gap-2 ${nameOrderClasses}`}>
          <Avatar name={message.sender.username} className="w-8 h-8 text-xs" />
          <span className="text-sm font-semibold text-foreground">
            {message.sender.username}
          </span>
        </div>
        {/* Container for the message bubble, indented to align with the name */}
        <div className={`mt-1 ${isAlignedLeft ? "ml-8" : "mr-8"}`}>
          <div
            className={`max-w-md lg:max-w-lg px-3 py-2 rounded-lg ${bubbleColor}`}
          >
            {hasAttachment && (
              <div className="mb-0">
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
            <div className="text-right text-xs text-muted-foreground/80">
              {formatTimestampIST(message.timestamp)}
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
}
