"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useExplorer } from "@/context/ExplorerContext";
import { ConversationPair } from "../types";
import AdminMessageBubble from "./AdminMessageBubble";

export default function AdminMessageViewer({
  selectedPair,
}: {
  selectedPair: ConversationPair | null;
}) {
  const { getMessageCache, fetchMessages, fetchMoreMessages } = useExplorer();
  const observer = useRef<IntersectionObserver>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const pairKey = selectedPair
    ? [selectedPair.user_one.id, selectedPair.user_two.id].sort().join("-")
    : "";
  const cache = getMessageCache(pairKey);

  useEffect(() => {
    if (selectedPair) {
      fetchMessages(selectedPair.user_one.id, selectedPair.user_two.id);
    }
  }, [selectedPair, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when a new conversation is selected and messages are loaded
    if (cache?.messages.length) {
      bottomRef.current?.scrollIntoView();
    }
  }, [cache]);

  const paginationTriggerRef = useCallback(
    (node) => {
      // ... (pagination logic remains the same)
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && cache?.nextCursor && selectedPair) {
          fetchMoreMessages(selectedPair.user_one.id, selectedPair.user_two.id);
        }
      });
      if (node) observer.current.observe(node);
    },
    [cache, selectedPair, fetchMoreMessages]
  );

  if (!selectedPair)
    return (
      <div className="flex-grow flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">
          Select a conversation to view messages.
        </p>
      </div>
    );

  return (
    <section className="flex-grow flex flex-col bg-muted/30 h-full">
      <header className="p-4 border-b border-border bg-background flex-shrink-0">
        <h3 className="font-semibold text-foreground">
          {selectedPair.user_one.username} &harr;{" "}
          {selectedPair.user_two.username}
        </h3>
        <p className="text-sm text-muted-foreground">
          {selectedPair.message_count} total messages
        </p>
      </header>
      {/* This main element is now the scrolling container */}
      <main className="flex-grow p-4 overflow-y-auto">
        <div ref={paginationTriggerRef} className="h-10 text-center">
          {cache?.nextCursor && (
            <p className="text-sm text-muted-foreground">
              Loading older messages...
            </p>
          )}
        </div>
        <div className="space-y-4">
          {cache?.messages.map((msg) => (
            <AdminMessageBubble
              key={msg._id}
              message={msg}
              userOneId={selectedPair.user_one.id}
            />
          ))}
        </div>
        <div ref={bottomRef} />
      </main>
    </section>
  );
}
