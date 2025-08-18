"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  ConversationPair,
  Message,
  MessagesResponse,
} from "@/components/types";
import {
  getAdminConversationPairs,
  getAdminUserToUserMessages,
} from "@/lib/api";
import { useAuth } from "./AuthContext";

interface MessageCache {
  messages: Message[];
  nextCursor: string | null;
}

interface ExplorerContextType {
  pairs: ConversationPair[];
  isLoadingPairs: boolean;
  getMessageCache: (pairKey: string) => MessageCache | undefined;
  fetchMessages: (user1Id: number, user2Id: number) => Promise<void>;
  fetchMoreMessages: (user1Id: number, user2Id: number) => Promise<void>;
}

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined
);

export const ExplorerProvider = ({ children }: { children: ReactNode }) => {
  const [pairs, setPairs] = useState<ConversationPair[]>([]);
  const [isLoadingPairs, setIsLoadingPairs] = useState(true);
  const [messagesCache, setMessagesCache] = useState<Map<string, MessageCache>>(
    new Map()
  );
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getAdminConversationPairs()
        .then(setPairs)
        .finally(() => setIsLoadingPairs(false));
    }
  }, [user]);

  const getMessageCache = (pairKey: string) => messagesCache.get(pairKey);

  const fetchMessages = useCallback(
    async (user1Id: number, user2Id: number) => {
      const pairKey = [user1Id, user2Id].sort().join("-");
      if (messagesCache.has(pairKey)) return;

      const response = await getAdminUserToUserMessages(user1Id, user2Id);
      setMessagesCache((prev) =>
        new Map(prev).set(pairKey, {
          // *** CORRECTED: Reverse the messages on initial fetch ***
          messages: [...response.messages].reverse(),
          nextCursor: response.next_cursor,
        })
      );
    },
    [messagesCache]
  );

  const fetchMoreMessages = useCallback(
    async (user1Id: number, user2Id: number) => {
      const pairKey = [user1Id, user2Id].sort().join("-");
      const existing = messagesCache.get(pairKey);
      if (!existing || !existing.nextCursor) return;

      const response = await getAdminUserToUserMessages(
        user1Id,
        user2Id,
        50,
        existing.nextCursor
      );
      setMessagesCache((prev) =>
        new Map(prev).set(pairKey, {
          messages: [...[...response.messages].reverse(), ...existing.messages],
          nextCursor: response.next_cursor,
        })
      );
    },
    [messagesCache]
  );

  return (
    <ExplorerContext.Provider
      value={{
        pairs,
        isLoadingPairs,
        getMessageCache,
        fetchMessages,
        fetchMoreMessages,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};
export const useExplorer = (): ExplorerContextType => {
  const context = useContext(ExplorerContext);
  if (context === undefined)
    throw new Error("useExplorer must be used within an ExplorerProvider");
  return context;
};
