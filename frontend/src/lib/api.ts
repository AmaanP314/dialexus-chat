import {
  CurrentUser,
  ConversationsResponse,
  MessagesResponse,
  Conversation,
  SearchResults,
  AdminViewUser,
  AdminViewGroup,
  CreatedGroup,
  ConversationPair,
  NotificationSummaryResponse,
} from "@/components/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

let isRefreshing = false;

const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  options.credentials = "include";
  let response = await fetch(`${API_BASE_URL}${url}`, options);

  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (refreshResponse.ok) {
        response = await fetch(`${API_BASE_URL}${url}`, options);
      }
    } finally {
      isRefreshing = false;
    }
  }
  return response;
};

export const refreshToken = async (): Promise<Response> => {
  console.log("Attempting to refresh token...");
  const response = await apiFetch("/auth/refresh", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token.");
  }

  console.log("Token refreshed successfully.");
  return response;
};

export const loginUser = async ({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<Response> => {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
};

export const logoutUser = async (): Promise<Response> => {
  return apiFetch("/auth/logout", { method: "POST", credentials: "include" });
};

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await apiFetch("/users/me");
  if (!response.ok) throw new Error("Not authenticated");
  return response.json();
};

// --- CORRECTED: No longer needs a token parameter ---
export const getConversations = async (): Promise<ConversationsResponse> => {
  const response = await apiFetch("/users/conversations");
  if (!response.ok) throw new Error("Failed to fetch conversations.");
  return response.json();
};

// --- CORRECTED: No longer needs a token parameter ---
export const getMessages = async (
  conversation: Conversation,
  limit: number = 50,
  before: string | null = null
): Promise<MessagesResponse> => {
  const conversationType = conversation.type === "group" ? "group" : "private";
  const partnerRole =
    conversation.type === "user" || conversation.type === "admin"
      ? conversation.type
      : null;
  const partnerId = conversation.id;

  const params = new URLSearchParams({ limit: String(limit) });
  if (partnerRole) params.append("partner_role", partnerRole);
  if (before) params.append("before", before);

  const url = `/messages/${conversationType}/${partnerId}?${params.toString()}`;
  const response = await apiFetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch messages: ${errorData.detail || response.statusText}`
    );
  }
  return response.json();
};

// --- CORRECTED: No longer needs a token parameter ---
export const searchAll = async (query: string): Promise<SearchResults> => {
  const response = await apiFetch(
    `/users/search?query=${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error("Failed to perform search.");
  return response.json();
};

export const uploadToCloudinary = async (
  file: File,
  resourceType: "image" | "video" | "raw"
): Promise<string> => {
  const CLOUD_NAME = "dcnhvjjc9";
  const UPLOAD_PRESET = "chat_app";
  const URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("resource_type", resourceType);

  const response = await fetch(URL, { method: "POST", body: formData });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }
  const data = await response.json();
  return data.secure_url;
};

// --- New Admin API Functions ---

export const getAdminAllUsers = async (): Promise<AdminViewUser[]> => {
  const response = await apiFetch("/admin/users/all");
  if (!response.ok) throw new Error("Failed to fetch all users.");
  return response.json();
};

export const getAdminOnlineUsers = async (): Promise<AdminViewUser[]> => {
  const response = await apiFetch("/admin/users/online");
  if (!response.ok) throw new Error("Failed to fetch online users.");
  return response.json();
};

export const getAdminDeactivatedUsers = async (): Promise<AdminViewUser[]> => {
  const response = await apiFetch("/admin/users/deactivated");
  if (!response.ok) throw new Error("Failed to fetch deactivated users.");
  return response.json();
};

export const getAdminAllGroups = async (): Promise<AdminViewGroup[]> => {
  const response = await apiFetch("/admin/groups/all");
  if (!response.ok) throw new Error("Failed to fetch all groups.");
  return response.json();
};

export const getAdminDeactivatedGroups = async (): Promise<
  AdminViewGroup[]
> => {
  const response = await apiFetch("/admin/groups/deactivated");
  if (!response.ok) throw new Error("Failed to fetch deactivated groups.");
  return response.json();
};

// User managements
export const createUser = async (
  credentials: object
): Promise<AdminViewUser> => {
  const response = await apiFetch("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) throw new Error("Failed to create user.");
  return response.json();
};

export const deactivateUser = async (userId: number): Promise<Response> => {
  return apiFetch(`/admin/users/${userId}/deactivate`, { method: "PATCH" });
};

export const reactivateUser = async (userId: number): Promise<Response> => {
  return apiFetch(`/admin/users/${userId}/reactivate`, { method: "PATCH" });
};

export const resetUserPassword = async (
  userId: number,
  newPassword: string
): Promise<Response> => {
  return apiFetch(`/admin/users/${userId}/reset-password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password: newPassword }),
  });
};

export const createGroup = async (
  name: string,
  memberIds: number[]
): Promise<CreatedGroup> => {
  const response = await apiFetch("/admin/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, members: memberIds }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create group.");
  }
  return response.json();
};

export const addGroupMember = async (
  groupId: number,
  userId: number
): Promise<Response> => {
  return apiFetch(`/admin/groups/${groupId}/members/${userId}`, {
    method: "POST",
  });
};

export const removeGroupMember = async (
  groupId: number,
  userId: number
): Promise<Response> => {
  return apiFetch(`/admin/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
};

export const deactivateGroup = async (groupId: number): Promise<Response> => {
  return apiFetch(`/admin/groups/${groupId}`, { method: "DELETE" });
};

export const getAdminConversationPairs = async (): Promise<
  ConversationPair[]
> => {
  const response = await apiFetch("/admin/conversations/users");
  if (!response.ok) throw new Error("Failed to fetch conversation pairs.");
  return response.json();
};

export const getAdminUserToUserMessages = async (
  user1Id: number,
  user2Id: number,
  limit: number = 20,
  before: string | null = null
): Promise<MessagesResponse> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) {
    params.append("before", before);
  }
  const url = `/admin/messages/users/${user1Id}/${user2Id}?${params.toString()}`;
  const response = await apiFetch(url);
  if (!response.ok) throw new Error("Failed to fetch user-to-user messages.");
  return response.json();
};

export const getNotificationSummary =
  async (): Promise<NotificationSummaryResponse> => {
    const response = await apiFetch("/notifications/summary");
    if (!response.ok) throw new Error("Failed to fetch notification summary.");
    return response.json();
  };

export const changeFullName = async (fullName: string): Promise<Response> => {
  return apiFetch("/users/me/full-name", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: fullName }),
  });
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<Response> => {
  return apiFetch("/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });
};

export const pinConversation = async (
  conversation: Conversation
): Promise<Response> => {
  return apiFetch("/pins/conversations/pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversation.id,
      conversation_type: conversation.type === "group" ? "group" : "private",
      conversation_role:
        conversation.type === "group" ? null : conversation.type,
    }),
  });
};

export const unpinConversation = async (
  conversation: Conversation
): Promise<Response> => {
  return apiFetch("/pins/conversations/unpin", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversation.id,
      conversation_type: conversation.type === "group" ? "group" : "private",
      conversation_role:
        conversation.type === "group" ? null : conversation.type,
    }),
  });
};
