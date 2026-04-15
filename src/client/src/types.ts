export interface ApiErrorShape {
  status?: number;
  message?: string;
  errors?: Record<string, string>;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  bio: string | null;
  photoUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Post {
  id: number;
  authorUsername: string;
  authorDisplayName: string;
  authorPhotoUrl: string | null;
  imageUrl: string | null;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  authorUsername: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: number;
  senderUsername: string;
  recipientUsername: string;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  username: string;
  displayName: string;
  photoUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
}
