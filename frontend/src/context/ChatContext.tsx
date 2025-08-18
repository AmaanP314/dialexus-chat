"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { ChatState, ChatAction, ConversationCache } from "@/components/types";

const initialState: ChatState = {
  conversations: new Map(),
  selectedConversationId: null,
};

const ChatContext = createContext<
  | {
      state: ChatState;
      dispatch: React.Dispatch<ChatAction>;
    }
  | undefined
>(undefined);

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_SELECTED_CONVERSATION":
      return { ...state, selectedConversationId: action.payload };

    case "START_MESSAGES_LOADING": {
      const { conversationId } = action.payload;
      const newConversations = new Map(state.conversations);
      const existing = newConversations.get(conversationId) || {
        messages: [],
        nextCursor: null,
        hasLoaded: false,
      };
      newConversations.set(conversationId, { ...existing, isLoading: true });
      return { ...state, conversations: newConversations };
    }

    case "MESSAGES_LOADED": {
      const { conversationId, messages, nextCursor } = action.payload;
      const newConversations = new Map(state.conversations);
      newConversations.set(conversationId, {
        messages,
        nextCursor,
        isLoading: false,
        hasLoaded: true,
      });
      return { ...state, conversations: newConversations };
    }

    case "OLDER_MESSAGES_LOADED": {
      const { conversationId, messages, nextCursor } = action.payload;
      const newConversations = new Map(state.conversations);
      const existing = newConversations.get(conversationId);
      if (existing) {
        newConversations.set(conversationId, {
          ...existing,
          messages: [...messages, ...existing.messages], // Prepend older messages
          nextCursor,
          isLoading: false,
        });
      }
      return { ...state, conversations: newConversations };
    }

    default:
      return state;
  }
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
