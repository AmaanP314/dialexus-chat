"use client";

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  MoreVertical,
  Paperclip,
  Send,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { Message, Conversation, MessageContent } from "./types";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { AttachmentPreview } from "./AttachmentPreview"; // Assuming this component exists
import { uploadToCloudinary } from "@/lib/api";
import {
  formatLastSeen,
  areDatesOnSameDay,
  formatDateHeader,
} from "@/lib/utils";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  isLoading: boolean;
  onLoadMore: () => void;
  onSendMessage: (content: MessageContent) => void;
  onDeleteMessage: (messageId: string) => void;
}

const DateHeader = ({ date }: { date: string }) => (
  <div className="sticky top-0 z-10 py-2">
    {" "}
    {/* Transparent background */}
    <div className="flex justify-center">
      <div className="px-3 py-1 bg-background rounded-full text-xs text-muted-foreground shadow-sm">
        {formatDateHeader(date)}
      </div>
    </div>
  </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isLoading,
  onLoadMore,
  onSendMessage,
  onDeleteMessage,
}) => {
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { presence } = usePresence();
  const userKey = `${conversation.type}-${conversation.id}`;
  const presenceInfo = presence[userKey];

  // Group messages by date for sticky headers
  const messageGroups = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = [];
    if (!messages.length) return groups;

    let currentGroup: { date: string; messages: Message[] } | null = null;

    for (const msg of messages) {
      const msgDate = msg.timestamp.substring(0, 10);
      if (!currentGroup || currentGroup.date !== msgDate) {
        currentGroup = { date: msgDate, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    }
    return groups;
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`; // Set to content height
    }
  }, [inputText]);

  const handleSend = async () => {
    if (isUploading || (!inputText.trim() && !attachment)) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      let uploadedUrl: string | null = null;
      let attachmentType: "image" | "file" | null = null;

      if (attachment) {
        // *** CORRECTED LOGIC: Determine resource type before uploading ***
        const resourceType = attachment.type.startsWith("image/")
          ? "image"
          : attachment.type.startsWith("video/")
          ? "video"
          : "raw";

        uploadedUrl = await uploadToCloudinary(attachment, resourceType);
        attachmentType = resourceType === "image" ? "image" : "file"; // Keep 'file' for non-image types for our UI
      }

      const content: MessageContent = {
        text: inputText.trim() || "",
        image: attachmentType === "image" ? uploadedUrl : null,
        file: attachmentType === "file" ? uploadedUrl : null,
      };

      onSendMessage(content);

      // Reset form on success
      setInputText("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to upload or send message:", error);
      setUploadError("Failed to upload attachment. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent new line on Enter
      handleSend();
    }
    // Shift + Enter will create a new line by default
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadError(null); // Clear previous errors
      setAttachment(file);
    }
  };

  const cancelAttachment = () => {
    setAttachment(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getStatusText = () => {
    if (presenceInfo?.status === "online") {
      return "Online";
    }
    if (presenceInfo?.status === "offline") {
      if (conversation.type === "user" && presenceInfo.lastSeen) {
        // You can create a more sophisticated "time ago" function if needed
        return formatLastSeen(presenceInfo.lastSeen);
      }
      return "Offline";
    }
    return "Offline"; // Default
  };

  // Set up the IntersectionObserver for pagination at the top of the chat
  const observer = useRef<IntersectionObserver>();
  const paginationTriggerRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, onLoadMore]
  );
  const isChatDisabled =
    conversation.type === "group" && conversation.is_member_active === false;
  // Scroll to bottom on initial load or when a new message is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages]);

  return (
    <section className="flex flex-col flex-grow h-screen bg-muted/30">
      <header className="flex items-center p-3 bg-muted/50 border-b border-border flex-shrink-0">
        <Avatar
          name={conversation.name}
          isOnline={presenceInfo?.status === "online"}
        />
        <div className="ml-4">
          <h2 className="font-bold text-foreground">
            {conversation.full_name || conversation.name}
          </h2>
          <p className="text-xs text-muted-foreground">{getStatusText()}</p>
        </div>
        <div className="ml-auto">
          <button className="p-2 text-muted-foreground hover:text-foreground">
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      <main ref={chatContainerRef} className="flex-grow overflow-y-auto">
        <div ref={paginationTriggerRef} className="h-10 text-center px-4 pt-4">
          {isLoading && (
            <p className="text-muted-foreground">Loading older messages...</p>
          )}
        </div>
        <div>
          {messageGroups.map(({ date, messages: dateMessages }) => (
            <div key={date}>
              <DateHeader date={date} />
              <div className="px-4">
                {dateMessages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isSentByCurrentUser={msg.sender.id === user?.id}
                    isGroupMessage={conversation.type === "group"}
                    onDelete={onDeleteMessage}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </main>

      {isChatDisabled ? (
        <footer className="p-4 border-t border-border flex-shrink-0 flex items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground italic text-center max-w-md">
            You have been removed from the group by the administrator. You can
            view past messages, but you can no longer send new ones.
          </p>
        </footer>
      ) : (
        <footer className="p-4 border-t border-border flex-shrink-0">
          {attachment && (
            <div className="p-2 border-b border-border">
              <AttachmentPreview
                file={attachment}
                onCancel={cancelAttachment}
                isUploading={isUploading}
              />
            </div>
          )}
          {uploadError && (
            <div className="p-2 text-red-500 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {uploadError}
            </div>
          )}
          <div className="flex items-end gap-2">
            {" "}
            {/* Use items-end to align bottom */}
            {/* File Input and Button */}
            <div className="flex items-center bg-muted rounded-full p-2 h-12">
              {" "}
              {/* Adjusted height for alignment */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
                aria-label="File upload input"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary rounded-full transition-colors duration-200"
                aria-label="Attach file"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isUploading}
              className="flex-grow px-4 py-2 bg-muted focus:outline-none text-foreground disabled:opacity-50 rounded-2xl transition-colors duration-200 focus:ring-2 focus:ring-primary resize-none leading-6"
              rows={1}
              style={{
                maxHeight: "9rem" /* Approx 6 lines */,
                overflowY: "auto",
              }}
              aria-label="Message input field"
            />
            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isUploading || (!inputText.trim() && !attachment)}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 h-12 w-12 flex items-center justify-center" // Ensure fixed size for circular shape
              aria-label="Send message"
              title="Send message"
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </footer>
      )}
    </section>
  );
};

export default ChatWindow;
