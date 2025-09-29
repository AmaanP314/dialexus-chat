// For the /api/v1/users/me endpoint
export interface CurrentUser {
  id: number;
  username: string;
  full_name: string | null;
  type: "user" | "admin" | "super_admin";
  created_at: string;
  admin_key?: string; // Only for admins
}

// For the /api/v1/users/search endpoint
export interface SearchResultUser {
  id: number;
  username: string;
  full_name: string | null;
  type: "User";
}

export interface SearchResultAdmin {
  id: number;
  username: string;
  full_name: string | null;
  type: "Admin";
  admin_key: string;
}

export interface SearchResultGroup {
  id: number;
  name: string;
  admin_id: number;
}

export interface SearchResults {
  users: SearchResultUser[];
  admins: SearchResultAdmin[];
  groups: SearchResultGroup[];
}

// For the /api/v1/users/conversations endpoint
export interface Conversation {
  id: number;
  name: string;
  full_name: string | null;
  type: "user" | "admin" | "group";
  last_message: string;
  timestamp: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

// For the /api/v1/messages/{...} endpoint
export interface MessageSender {
  id: number;
  username: string;
  role: "user" | "admin";
}

export interface MessageContent {
  text: string | null;
  image: string | null;
  file: string | null;
}

export interface Message {
  _id: string;
  type: "private" | "group";
  sender: MessageSender;
  receiver: MessageSender | null; // Null for group messages
  group: { id: number; name: string } | null; // Null for private messages
  content: MessageContent;
  timestamp: string;
  status: "sent" | "received" | "read";
}

export interface MessagesResponse {
  messages: Message[];
  next_cursor: string | null;
}

// A new type to manage the currently selected conversation's state
export interface SelectedConversation {
  id: number;
  name: string;
  type: "user" | "group";
  role?: "user" | "admin"; // Optional role for private chats
}

export interface ConversationCache {
  messages: Message[];
  nextCursor: string | null;
}

export interface ChatState {
  conversations: Map<number, ConversationCache>;
  selectedConversationId: number | null;
}

// Type for a message received via WebSocket
export interface RealtimeMessage extends Omit<Message, "status"> {
  status?: "sent" | "received" | "read"; // Status is optional on incoming
}

// For /api/v1/admin/users/* endpoints
export interface AdminViewUser {
  id: number;
  username: string;
  full_name: string | null;
  type: "User"; // Assuming it's always 'User' in this context
}

// For /api/v1/admin/groups/* endpoints
export interface GroupMember {
  user_id: number;
  username: string;
  full_name: string | null;
}

export interface AdminViewGroup {
  id: number;
  name: string;
  admin_id: number;
  is_active: boolean;
  members: GroupMember[];
}

// For caching all stats data in the Overview component
export interface OverviewStats {
  totalUsers: AdminViewUser[];
  onlineUsers: AdminViewUser[];
  deactivatedUsers: AdminViewUser[];
  totalGroups: AdminViewGroup[];
  deactivatedGroups: AdminViewGroup[];
}

export interface CreatedGroup {
  id: number;
  name: string;
  admin_id: number;
}

export interface ConversationUser {
  id: number;
  username: string;
}

export interface ConversationPair {
  user_one: ConversationUser;
  user_two: ConversationUser;
  last_message_timestamp: string;
  message_count: number;
}
