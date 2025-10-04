// chat-frontend/src/components/ConversationList.tsx

import React from "react";
import { Conversation } from "./types";
import ConversationItem from "./ConversationItem";

interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversation: Conversation | null;
  onTogglePin: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onConversationSelect,
  selectedConversation,
  onTogglePin,
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
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
};

export default ConversationList;
