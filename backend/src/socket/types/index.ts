export interface Blog {
    id: string;
    title: string;
    slug: string
    content: string;
    tags: { name: string }[];
    likes: { userId: string }[];
    author: {
      id: string;
      username: string;
      avatar: string
    };
    createdAt: string;
    _count: { comments: number, likes?: number }
}

export interface Note {
    id: string;
    content: string;
    image?: string
    likes: { userId: string }[];
    author: {
      id: string;
      username: string;
      avatar: string
    };
    createdAt: string;
    _count: { likes: number }
}

export interface Comment {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
    };
    createdAt: string;
    blogId: string;
}