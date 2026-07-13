export interface User {
  id: string;
  avatar: string
  username: string;
  email: string;
  role: 'ADMIN' | 'USER';
  plan: "FREE" | "PREMIUM";
  bio?: string;
  createdAt?: string;
  isBlocked?: boolean;
}

export interface Blog {
  id: string;
  title: string;
  slug: string
  content: string;
  tags: { name: string }[];
  likes: { userId: string }[]; // array of user IDs
  author: {
    id: string;
    username: string;
    avatar: string
  } | User;
  createdAt: string;
  _count: { comments: number, likes?: number }
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
  } | User;
  createdAt: string;
  blogId: string;
}

export interface Note {
  id: string;
  content: string;
  image?: string
  authorId?: string
  likes: { userId: string }[]; // array of user IDs
  author: {
    id: string;
    username: string;
    avatar: string
  } | User;
  createdAt: string;
  _count: { likes: number }
}
