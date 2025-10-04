"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserProfile from "./UserProfile";
import ConversationList from "./ConversationList";
import { searchAll } from "@/lib/api";
import {
  SearchResults,
  Conversation,
  SearchResultUser,
  SearchResultAdmin,
  SearchResultGroup,
} from "./types";
import Avatar from "./Avatar";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

interface SidebarProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversation: Conversation | null;
  onTogglePin: (conversation: Conversation) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  onConversationSelect,
  selectedConversation,
  onTogglePin,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const { user } = useAuth(); // Use the user object as the auth signal

  // --- CORRECTED: Search is now triggered by the user object ---
  useEffect(() => {
    if (debouncedQuery && user) {
      // Check for user, not token
      setIsSearching(true);
      searchAll(debouncedQuery) // No token needed
        .then((data) => {
          setResults(data);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setResults(null);
    }
  }, [debouncedQuery, user]); // Dependency is now `user`

  const handleSearchSelect = (
    item: SearchResultUser | SearchResultAdmin | SearchResultGroup
  ) => {
    const conversationType =
      "name" in item ? "group" : (item.type.toLowerCase() as "user" | "admin");
    const conversation: Conversation = {
      id: item.id,
      name: "name" in item ? item.name : item.username,
      full_name: "full_name" in item ? item.full_name : null,
      type: conversationType,
      last_message: `Start a conversation with ${
        "name" in item ? item.name : item.username
      }`,
      timestamp: new Date().toISOString(),
    };
    setQuery("");
    setResults(null);
    onConversationSelect(conversation);
  };

  return (
    // <aside className="w-full md:w-1/3 lg:w-1/4 h-screen bg-background border-r border-border flex flex-col">
    <aside className="w-full md:w-96 bg-background border-r border-border flex flex-col flex-shrink-0">
      <UserProfile />
      <div className="p-4 bg-background border-b border-border">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {query ? (
          <div className="p-2">
            {isSearching && (
              <p className="text-muted-foreground text-center p-4">
                Searching...
              </p>
            )}
            {results && (
              <>
                {results.users.map((u) => (
                  <SearchResultItem
                    key={`user-${u.id}`}
                    // name={u.username}
                    name={u.full_name || u.username}
                    type="User"
                    onClick={() => handleSearchSelect(u)}
                  />
                ))}
                {results.admins.map((a) => (
                  <SearchResultItem
                    key={`admin-${a.id}`}
                    // name={a.username}
                    name={a.full_name || a.username}
                    type="Admin"
                    onClick={() => handleSearchSelect(a)}
                  />
                ))}
                {results.groups.map((g) => (
                  <SearchResultItem
                    key={`group-${g.id}`}
                    name={g.name}
                    type="Group"
                    onClick={() => handleSearchSelect(g)}
                  />
                ))}
              </>
            )}
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            onConversationSelect={onConversationSelect}
            // selectedConversationId={selectedConversationId}
            selectedConversation={selectedConversation}
            onTogglePin={onTogglePin}
          />
        )}
      </div>
    </aside>
  );
};

const SearchResultItem = ({
  name,
  type,
  onClick,
}: {
  name: string;
  type: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="flex items-center p-3 cursor-pointer hover:bg-muted/50 rounded-lg"
  >
    <Avatar name={name} />
    <div className="ml-4">
      <h3 className="font-semibold text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground">{type}</p>
    </div>
  </div>
);

export default Sidebar;
