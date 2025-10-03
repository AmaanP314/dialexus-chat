"use client";

import React, { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import {
  Conversation,
  ConversationCache,
  Message,
  RealtimeMessage,
  MessageContent,
} from "@/components/types";
import { MessageSquareText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useNotification } from "@/context/NotificationContext";
import { getMessages, getConversations } from "@/lib/api";

export default function ChatPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { lastEvent, sendMessage } = useSocket();
  const { setActiveChatId, clearUnreadCount, unreadCounts } = useNotification();

  const [conversationsList, setConversationsList] = useState<Conversation[]>(
    []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationsCache, setConversationsCache] = useState<
    Map<string, ConversationCache>
  >(new Map());

  const [isLoadingMessages, setIsLoadingMessages] = useState<
    Map<string, boolean>
  >(new Map());

  useEffect(() => {
    if (user) {
      getConversations().then((response) => {
        setConversationsList(response.conversations);
      });
    }
  }, [user]);

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedConversation || !user) return;

    // Send delete event to backend
    sendMessage({
      event: "delete_message",
      message_id: messageId,
    });

    // Optimistic UI update (optional - the backend will send back message_deleted event)
    // If you want immediate feedback, uncomment below:

    const compositeKey = getCompositeKey(selectedConversation);
    const isAdmin = user.type === "admin" || user.type === "super_admin";

    setConversationsCache((prevCache) => {
      const newCache = new Map(prevCache);
      const conversationData = newCache.get(compositeKey);

      if (conversationData) {
        const updatedMessages = conversationData.messages.map((msg) => {
          if (msg._id === messageId) {
            if (isAdmin) {
              return { ...msg, is_deleted: true };
            } else {
              return {
                ...msg,
                is_deleted: true,
                content: {
                  text: "This message was deleted",
                  image: null,
                  file: null,
                },
              };
            }
          }
          return msg;
        });

        newCache.set(compositeKey, {
          ...conversationData,
          messages: updatedMessages,
        });
      }

      return newCache;
    });
  };

  const getCompositeKey = (conversation: {
    type: string;
    id: number;
  }): string => {
    return `${conversation.type}-${conversation.id}`;
  };

  const handleRealtimeMessage = useCallback(
    (msg: RealtimeMessage) => {
      let conversationId: string;
      let conversationType: "user" | "admin" | "group";

      if (msg.type === "group") {
        conversationId = getCompositeKey({ type: "group", id: msg.group!.id });
        conversationType = "group";
      } else {
        const partner = msg.sender.id === user?.id ? msg.receiver! : msg.sender;
        conversationId = getCompositeKey({
          type: partner.role,
          id: partner.id,
        });
        conversationType = partner.role as "user" | "admin";
      }

      setConversationsCache((prevCache) => {
        const newCache = new Map(prevCache);
        const existing = newCache.get(conversationId);
        if (existing) {
          newCache.set(conversationId, {
            ...existing,
            messages: [...existing.messages, msg as Message],
          });
        }
        return newCache;
      });

      setConversationsList((prevList) => {
        const convoIdentifier =
          conversationType === "group"
            ? { id: msg.group!.id, type: "group" }
            : {
                id:
                  msg.sender.id === user?.id ? msg.receiver!.id : msg.sender.id,
                type: conversationType,
              };

        const existingConvoIndex = prevList.findIndex(
          (c) => c.id === convoIdentifier.id && c.type === convoIdentifier.type
        );
        let updatedList = [...prevList];

        if (existingConvoIndex > -1) {
          const existingConvo = updatedList[existingConvoIndex];
          existingConvo.last_message = msg.content.text || "[attachment]";
          existingConvo.last_message_id = msg._id;
          existingConvo.timestamp = msg.timestamp;
          existingConvo.last_message_is_deleted = false; // *** ADD THIS LINE ***
          updatedList.splice(existingConvoIndex, 1);
          updatedList.unshift(existingConvo);
        } else {
          const newConvo: Conversation = {
            id: convoIdentifier.id,
            name: msg.type === "group" ? msg.group!.name : msg.sender.username,
            full_name: null,
            type: conversationType,
            last_message: msg.content.text || "[attachment]",
            last_message_id: msg._id,
            timestamp: msg.timestamp,
            last_message_is_deleted: false, // *** ADD THIS LINE ***
          };
          updatedList.unshift(newConvo);
        }
        return updatedList;
      });
    },
    [user?.id]
  );

  useEffect(() => {
    if (!lastEvent || !user) return;

    // --- HANDLE NEW MESSAGES ---
    if (
      lastEvent.event === "new_message" &&
      (lastEvent.type === "private" || lastEvent.type === "group")
    ) {
      handleRealtimeMessage(lastEvent);
    }

    if (lastEvent.event === "message_acknowledged") {
      const { temp_id, new_id, conversation, timestamp } = lastEvent;

      // Create conversation key using the format you specified
      const conversationKey = `${conversation.role || conversation.type}-${
        conversation.id
      }`;
      console.log("Updating message ID in conversation:", conversationKey);

      setConversationsCache((prevCache) => {
        const newCache = new Map(prevCache);
        const conversationData = newCache.get(conversationKey);

        if (conversationData) {
          const updatedMessages = conversationData.messages.map((msg) => {
            // Find message with temp_id and replace with new_id
            if (msg._id === temp_id) {
              return {
                ...msg,
                _id: new_id,
                timestamp: timestamp || msg.timestamp, // Update timestamp if provided
              };
            }
            return msg;
          });

          newCache.set(conversationKey, {
            ...conversationData,
            messages: updatedMessages,
          });
        }
        console.log(newCache.get(conversationKey));
        return newCache;
      });

      // Also update the conversation list if this was the last message
      setConversationsList((prevList) => {
        return prevList.map((conv) => {
          const convKey = `${conv.type}-${conv.id}`;
          if (convKey === conversationKey) {
            // Check if the last message needs updating
            // This is useful if the conversation list shows message IDs
            return { ...conv, timestamp: timestamp || conv.timestamp };
          }
          return conv;
        });
      });
    }

    // --- HANDLE MESSAGE DELETION ---
    if (lastEvent.event === "message_deleted") {
      const { message_id, conversation } = lastEvent;

      // Construct conversation key from the event data
      const conversationKey =
        conversation.type === "group"
          ? `group-${conversation.id}`
          : `${conversation.role}-${conversation.id}`;

      console.log(
        "Message deleted event received:",
        message_id,
        conversationKey
      );

      // Check if current user is admin
      const isAdmin = user?.type === "admin" || user?.type === "super_admin";

      // Update conversationsCache (if it exists)
      setConversationsCache((prevCache) => {
        const newCache = new Map(prevCache);
        const conversationData = newCache.get(conversationKey);

        if (conversationData) {
          const updatedMessages = conversationData.messages.map((msg) => {
            if (msg._id === message_id) {
              if (isAdmin) {
                // Admin: Keep original content but mark as deleted
                return {
                  ...msg,
                  is_deleted: true,
                };
              } else {
                // Normal user: Replace content with placeholder
                return {
                  ...msg,
                  is_deleted: true,
                  content: {
                    text: "This message was deleted",
                    image: null,
                    file: null,
                  },
                };
              }
            }
            return msg;
          });

          newCache.set(conversationKey, {
            ...conversationData,
            messages: updatedMessages,
          });
        }

        return newCache;
      });

      // Update conversationsList - check if deleted message is the last message
      setConversationsList((prevList) => {
        return prevList.map((conv) => {
          const convKey = `${conv.type}-${conv.id}`;

          if (convKey === conversationKey) {
            // Check if the deleted message_id matches the last_message_id
            if (conv.last_message_id === message_id) {
              return {
                ...conv,
                last_message: isAdmin
                  ? conv.last_message // Keep original for admin
                  : "This message was deleted", // Replace for normal user
                last_message_is_deleted: true,
              };
            }
          }
          return conv;
        });
      });
    }

    // --- HANDLE READ RECEIPTS ---
    if (lastEvent.event === "messages_status_update") {
      const { reader } = lastEvent;
      if (!reader) return;

      // Construct the key for the conversation that was read
      const compositeKey = `${reader.role}-${reader.id}`;

      setConversationsCache((prevCache) => {
        const newCache = new Map(prevCache);
        const conversationData = newCache.get(compositeKey);

        // Only update if we have the conversation's messages loaded
        if (conversationData) {
          const updatedMessages = conversationData.messages.map((msg) => {
            // If the message was sent by the current user, update its status to 'read'
            if (msg.sender.id === user.id) {
              return { ...msg, status: "read" as const };
            }
            return msg;
          });

          newCache.set(compositeKey, {
            ...conversationData,
            messages: updatedMessages,
          });
        }
        return newCache;
      });
    }
  }, [lastEvent, user, handleRealtimeMessage]);

  const handleSendMessage = (content: MessageContent) => {
    if (!selectedConversation || !user) return;

    const isGroup = selectedConversation.type === "group";
    let payload;
    const temp_id = `temp-${Date.now()}`; // Temporary ID for optimistic UI

    if (isGroup) {
      payload = {
        _id: temp_id,
        event: "new_message",
        type: "group",
        content, // Pass the whole content object
        group: { id: selectedConversation.id, name: selectedConversation.name },
      };
    } else {
      payload = {
        _id: temp_id,
        event: "new_message",
        type: "private",
        content, // Pass the whole content object
        receiver: {
          id: selectedConversation.id,
          role: selectedConversation.type,
          username: selectedConversation.name,
        },
      };
    }

    // Optimistic UI Update
    const optimisticMessage: Message = {
      _id: temp_id,
      sender: {
        id: user.id,
        username: user.username,
        role: user.type as "user" | "admin",
      },
      receiver: !isGroup
        ? {
            id: selectedConversation.id,
            username: selectedConversation.name,
            role: selectedConversation.type as "user" | "admin",
          }
        : null,
      group: isGroup
        ? { id: selectedConversation.id, name: selectedConversation.name }
        : null,
      content, // Use the full content object here too
      timestamp: new Date().toISOString(),
      status: "sent",
      type: isGroup ? "group" : "private",
    };
    handleRealtimeMessage(optimisticMessage as RealtimeMessage);

    sendMessage(payload);
  };

  // Update handleFetchMoreMessages
  const handleFetchMoreMessages = useCallback(async () => {
    if (!selectedConversation) return;
    const compositeKey = getCompositeKey(selectedConversation);
    if (isLoadingMessages.get(compositeKey)) return;

    const cache = conversationsCache.get(compositeKey);
    const nextCursor = cache?.nextCursor;

    if (!nextCursor) return;

    setIsLoadingMessages((prev) => new Map(prev).set(compositeKey, true));
    try {
      const response = await getMessages(selectedConversation, 10, nextCursor);
      const newMessages = response.messages.reverse();

      setConversationsCache((prevCache) => {
        const newMap = new Map(prevCache);
        const existingData = newMap.get(compositeKey);
        if (existingData) {
          newMap.set(compositeKey, {
            messages: [...newMessages, ...existingData.messages],
            nextCursor: response.next_cursor,
          });
        }
        return newMap;
      });
    } catch (error) {
      console.error("Failed to fetch more messages:", error);
    } finally {
      setIsLoadingMessages((prev) => new Map(prev).set(compositeKey, false));
    }
  }, [selectedConversation, conversationsCache, isLoadingMessages]);

  const handleConversationSelect = useCallback(
    async (conversation: Conversation) => {
      const compositeKey = getCompositeKey(conversation);
      if (
        selectedConversation &&
        getCompositeKey(selectedConversation) === compositeKey
      )
        return;

      setSelectedConversation(conversation);
      setActiveChatId(compositeKey);
      if (unreadCounts.get(compositeKey)) {
        clearUnreadCount(compositeKey);

        if (conversation.type === "group") {
          sendMessage({ event: "messages_read", group_id: conversation.id });
        } else {
          sendMessage({
            event: "messages_read",
            partner: { id: conversation.id, role: conversation.type },
          });
        }
      }
      // --- END NOTIFICATION LOGIC ---

      setConversationsList((prevList) => {
        if (
          prevList.some(
            (c) => c.id === conversation.id && c.type === conversation.type
          )
        )
          return prevList;
        return [conversation, ...prevList];
      });

      if (!conversationsCache.has(compositeKey)) {
        setIsLoadingMessages((prev) => new Map(prev).set(compositeKey, true));
        try {
          const response = await getMessages(conversation);
          const data = response.messages.reverse();
          setConversationsCache((prevCache) => {
            const newMap = new Map(prevCache);
            newMap.set(compositeKey, {
              messages: data,
              nextCursor: response.next_cursor,
            });
            return newMap;
          });
        } finally {
          setIsLoadingMessages((prev) =>
            new Map(prev).set(compositeKey, false)
          );
        }
      }
    },
    [
      conversationsCache,
      selectedConversation,
      setActiveChatId,
      clearUnreadCount,
      sendMessage,
      unreadCounts,
    ]
  );

  useEffect(() => {
    return () => {
      setActiveChatId(null);
    };
  }, [setActiveChatId]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-full">
      <Sidebar
        conversations={conversationsList}
        onConversationSelect={handleConversationSelect}
        selectedConversation={selectedConversation}
      />
      {selectedConversation ? (
        <ChatWindow
          key={getCompositeKey(selectedConversation)}
          conversation={selectedConversation}
          messages={
            conversationsCache.get(getCompositeKey(selectedConversation))
              ?.messages || []
          }
          isLoading={
            isLoadingMessages.get(getCompositeKey(selectedConversation)) ||
            false
          }
          onLoadMore={handleFetchMoreMessages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      ) : (
        <section className="hidden md:flex flex-col flex-grow bg-muted/30 items-center justify-center text-center p-8">
          <MessageSquareText className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Welcome!</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Select a chat to start messaging or search for a user to begin a new
            conversation.
          </p>
        </section>
      )}
    </main>
  );
}
