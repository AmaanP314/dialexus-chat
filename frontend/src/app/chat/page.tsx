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
import { getMessages, getConversations } from "@/lib/api";

export default function ChatPage() {
  const { user, lastEvent, sendMessage, isLoading: isAuthLoading } = useAuth();

  const [conversationsList, setConversationsList] = useState<Conversation[]>(
    []
  );
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversationsCache, setConversationsCache] = useState<
    Map<number, ConversationCache>
  >(new Map());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (user) {
      getConversations().then((response) => {
        setConversationsList(response.conversations);
      });
    }
  }, [user]);

  const handleRealtimeMessage = useCallback(
    (msg: RealtimeMessage) => {
      let conversationId: number;

      if (msg.type === "group") {
        conversationId = msg.group!.id;
      } else {
        conversationId =
          msg.sender.id === user?.id ? msg.receiver!.id : msg.sender.id;
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
        const existingConvoIndex = prevList.findIndex(
          (c) => c.id === conversationId
        );
        let updatedList = [...prevList];

        if (existingConvoIndex > -1) {
          const existingConvo = updatedList[existingConvoIndex];
          existingConvo.last_message = msg.content.text || "[attachment]";
          existingConvo.timestamp = msg.timestamp;
          updatedList.splice(existingConvoIndex, 1);
          updatedList.unshift(existingConvo);
        } else {
          const newConvo: Conversation = {
            id: msg.type === "group" ? msg.group!.id : msg.sender.id,
            name: msg.type === "group" ? msg.group!.name : msg.sender.username,
            type: msg.type === "group" ? "group" : msg.sender.role,
            last_message: msg.content.text || "[attachment]",
            timestamp: msg.timestamp,
          };
          updatedList.unshift(newConvo);
        }
        return updatedList;
      });
    },
    [user?.id]
  );

  useEffect(() => {
    if (lastEvent) {
      if (lastEvent.type === "private" || lastEvent.type === "group") {
        handleRealtimeMessage(lastEvent);
      }
    }
  }, [lastEvent, handleRealtimeMessage]);

  const handleSendMessage = (content: MessageContent) => {
    if (!selectedConversation || !user) return;

    const isGroup = selectedConversation.type === "group";
    let payload;

    if (isGroup) {
      payload = {
        event: "new_message",
        type: "group",
        content, // Pass the whole content object
        group: { id: selectedConversation.id, name: selectedConversation.name },
      };
    } else {
      payload = {
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
      _id: `temp-${Date.now()}`,
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

  const handleFetchMoreMessages = useCallback(async () => {
    if (!selectedConversation || isLoadingMessages) return;

    const cache = conversationsCache.get(selectedConversation.id);
    const nextCursor = cache?.nextCursor;

    if (!nextCursor) return; // No more messages to load

    setIsLoadingMessages(true);
    try {
      const response = await getMessages(selectedConversation, 10, nextCursor);
      const newMessages = response.messages.reverse();

      setConversationsCache((prevCache) => {
        const newMap = new Map(prevCache);
        const existingData = newMap.get(selectedConversation.id);
        if (existingData) {
          newMap.set(selectedConversation.id, {
            messages: [...newMessages, ...existingData.messages], // Prepend older messages
            nextCursor: response.next_cursor,
          });
        }
        return newMap;
      });
    } catch (error) {
      console.error("Failed to fetch more messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation, conversationsCache, isLoadingMessages]);

  const handleConversationSelect = useCallback(
    async (conversation: Conversation) => {
      if (selectedConversation?.id === conversation.id) return;
      setSelectedConversation(conversation);
      setConversationsList((prevList) => {
        if (prevList.some((c) => c.id === conversation.id)) return prevList;
        return [conversation, ...prevList];
      });

      if (!conversationsCache.has(conversation.id)) {
        setIsLoadingMessages(true);
        try {
          const response = await getMessages(conversation);
          const data = response.messages.reverse();
          setConversationsCache((prevCache) => {
            const newMap = new Map(prevCache);
            newMap.set(conversation.id, {
              messages: data,
              nextCursor: response.next_cursor,
            });
            return newMap;
          });
        } finally {
          setIsLoadingMessages(false);
        }
      }
    },
    [conversationsCache, selectedConversation]
  );

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
        selectedConversationId={selectedConversation?.id}
      />
      {selectedConversation ? (
        <ChatWindow
          key={selectedConversation.id}
          conversation={selectedConversation}
          messages={
            conversationsCache.get(selectedConversation.id)?.messages || []
          }
          isLoading={isLoadingMessages}
          onLoadMore={handleFetchMoreMessages}
          onSendMessage={handleSendMessage}
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
