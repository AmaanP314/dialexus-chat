// chat-frontend/src/components/ConversationList.tsx

import React from "react";
import { Conversation } from "./types";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversation: Conversation | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationSelect,
  selectedConversation,
}) => {
  if (!conversations) {
    return (
      <div className="p-4 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      {conversations.map((convo) => (
        <ConversationItem
          key={`${convo.type}-${convo.id}`}
          conversation={convo}
          isSelected={
            selectedConversation?.id === convo.id &&
            selectedConversation?.type === convo.type
          }
          onClick={() => onConversationSelect(convo)}
        />
      ))}
    </div>
  );
};

export default ConversationList;
