This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```js
// --- src/components/ConversationList.tsx ---
import React, { useState, useEffect } from 'react';
import { getConversations } from '@/lib/api';
import { Conversation } from './types';
import ConversationItem from './ConversationItem';
import { useAuth } from '@/context/AuthContext';

interface ConversationListProps {
  onConversationSelect: (conversation: Conversation) => void;
  selectedConversationId?: number | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ onConversationSelect, selectedConversationId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      getConversations(token)
        .then(response => setConversations(response.conversations))
        .catch(error => console.error("Failed to fetch conversations:", error))
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading chats...</div>;
  }

  return (
    <div className="flex-grow overflow-y-auto">
      {conversations.map((convo) => (
        <ConversationItem
          key={convo.id}
          conversation={convo}
          isSelected={selectedConversationId === convo.id}
          onClick={() => onConversationSelect(convo)}
        />
      ))}
    </div>
  );
};
export default ConversationList;


// --- src/components/ConversationItem.tsx ---
import { format, isToday, isYesterday } from 'date-fns';
import Avatar from './Avatar';
// import { Conversation } from './types'; // Already imported above

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd/MM/yyyy');
};

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, isSelected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-200 ${
        isSelected ? 'bg-muted' : 'hover:bg-muted/50'
      }`}
    >
      <Avatar name={conversation.name} />
      <div className="flex-grow ml-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">{conversation.name}</h3>
          <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {formatTimestamp(conversation.timestamp)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {conversation.last_message}
        </p>
      </div>
    </div>
  );
};
// export default ConversationItem; // Already exported above


// --- src/components/UserProfile.tsx ---
import { MoreVertical } from 'lucide-react';
// import { useAuth } from '@/context/AuthContext'; // Already imported above
// import Avatar from './Avatar'; // Already imported above

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <div className="flex items-center justify-between p-4 h-[70px] bg-muted/50 animate-pulse"></div>;
  }
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 flex-shrink-0">
      <Avatar name={user.username} />
      <div className="flex-grow ml-4">
        <h2 className="font-bold text-foreground">{user.username}</h2>
        <p className="text-sm capitalize text-muted-foreground">{user.type}</p>
      </div>
      <button className="p-2 text-muted-foreground hover:text-foreground">
        <MoreVertical size={20} />
      </button>
    </div>
  );
};
// export default UserProfile; // Already exported above


// --- src/components/Avatar.tsx ---
interface AvatarProps {
  name: string;
  className?: string;
}
const Avatar: React.FC<AvatarProps> = ({ name, className }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary select-none flex-shrink-0 ${className}`}>
      <span className="text-xl font-bold">{initial}</span>
    </div>
  );
};
// export default Avatar; // Already exported above


// --- src/components/MessageBubble.tsx ---
import MessageStatus from './MessageStatus';
// import { Message } from './types'; // Already imported above
// import { format } from 'date-fns'; // Already imported above

interface MessageBubbleProps {
  message: Message;
  isSentByCurrentUser: boolean;
}
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSentByCurrentUser }) => {
  const bubbleAlignment = isSentByCurrentUser ? 'justify-end' : 'justify-start';
  const bubbleColor = isSentByCurrentUser ? 'bg-bubble-sent' : 'bg-bubble-received';
  return (
    <div className={`flex ${bubbleAlignment} mb-2`}>
      <div className={`max-w-md lg:max-w-2xl px-3 py-2 rounded-lg ${bubbleColor} shadow-md`}>
        <p className="text-foreground text-sm whitespace-pre-wrap break-words">
          {message.content.text}
        </p>
        <div className="flex items-center justify-end mt-1">
          <span className="text-xs text-muted-foreground/80 mr-1">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {isSentByCurrentUser && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
};
// export default MessageBubble; // Already exported above


// --- src/components/MessageStatus.tsx ---
import { Check, CheckCheck } from 'lucide-react';
interface MessageStatusProps {
  status: 'sent' | 'received' | 'read';
}
const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const iconSize = 16;
  const className = "inline-block";
  switch (status) {
    case 'read': return <CheckCheck size={iconSize} className={`${className} text-status-read`} />;
    case 'received': return <CheckCheck size={iconSize} className={`${className} text-muted-foreground/80`} />;
    case 'sent': return <Check size={iconSize} className={`${className} text-muted-foreground/80`} />;
    default: return null;
  }
};
// export default MessageStatus; // Already exported above

```
