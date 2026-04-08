export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUid: string;
  toUid: string;
  content: string;
  createdAt: string;
}
