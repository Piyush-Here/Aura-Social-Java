export interface User {
  uid: string;
  username: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt: number;
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
  createdAt: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: number;
}
