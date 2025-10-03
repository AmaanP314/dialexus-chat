"use client";

import React, { useState, useMemo } from "react";
import { useExplorer } from "@/context/ExplorerContext";
import { ConversationPair } from "../types";
import {
  Search,
  ArrowUp,
  ArrowDown,
  MessagesSquare,
  Calendar,
} from "lucide-react";
import Avatar from "../Avatar";
import { formatConversationTimestamp } from "@/lib/utils";

type SortKey = "timestamp" | "messages";
type SortOrder = "asc" | "desc";

export default function ConversationPairList({
  onPairSelect,
  selectedPair,
}: {
  onPairSelect: (pair: ConversationPair) => void;
  selectedPair: ConversationPair | null;
}) {
  const { pairs, isLoadingPairs } = useExplorer();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedAndFilteredPairs = useMemo(() => {
    return pairs
      .filter(
        (p) =>
          p.user_one.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          p.user_two.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const valA =
          sortKey === "timestamp"
            ? new Date(a.last_message_timestamp).getTime()
            : a.message_count;
        const valB =
          sortKey === "timestamp"
            ? new Date(b.last_message_timestamp).getTime()
            : b.message_count;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
  }, [pairs, searchTerm, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <aside className="w-96 bg-background border-r border-border flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Conversation Explorer
        </h2>
        <div className="relative mt-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-muted border border-border"
          />
        </div>
        <div className="flex justify-between items-center gap-2 mt-3 text-xs">
          <span className="text-muted-foreground">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleSort("timestamp")}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                sortKey === "timestamp"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              Date{" "}
              {sortKey === "timestamp" &&
                (sortOrder === "asc" ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                ))}
            </button>
            <button
              onClick={() => handleSort("messages")}
              className={`flex items-center gap-1 px-2 py-1 rounded ${
                sortKey === "messages"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              Messages{" "}
              {sortKey === "messages" &&
                (sortOrder === "asc" ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                ))}
            </button>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {isLoadingPairs ? (
          <p className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </p>
        ) : (
          sortedAndFilteredPairs.map((pair) => (
            <div
              key={`${pair.user_one.id}-${pair.user_two.id}`}
              onClick={() => onPairSelect(pair)}
              className={`p-4 border-b border-border cursor-pointer ${
                selectedPair === pair ? "bg-muted" : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={pair.user_one.username}
                    className="w-8 h-8 text-xs"
                  />
                  <span>{pair.user_one.username}</span>
                </div>
                <span className="text-muted-foreground font-normal text-xs">
                  &harr;
                </span>
                <div className="flex items-center gap-2">
                  <span>{pair.user_two.username}</span>
                  <Avatar
                    name={pair.user_two.username}
                    className="w-8 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>
                    {formatConversationTimestamp(pair.last_message_timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessagesSquare size={12} />
                  <span>{pair.message_count} msgs</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
