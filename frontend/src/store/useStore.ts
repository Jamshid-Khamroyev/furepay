import { create } from 'zustand';
import { User, Blog, Note } from '../types';
import { Dispatch, SetStateAction } from 'react';

interface StoreState {
  user: User | null;
  blogs: Blog[];
  notes: Note[];
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  
  // Blog actions
  setBlogs: (blogs: Blog[]) => void;
  addBlog: (blog: Blog) => void;
  updateBlog: (blogId: string, updated: Partial<Blog>) => void;
  deleteBlog: (blogId: string) => void;

  // Note actions
  setNotes: (notes: SetStateAction<Note[]>) => void;
  addNote: (note: Note) => void;
  updateNote: (noteId: string, updated: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  user: null,
  blogs: [],
  notes: [],
  signup: async (userData) => set({ user: userData }),
  logout: async () => set({ user: null, blogs: [], notes: [] }),

  setBlogs: (blogs) => set({ blogs }),
  addBlog: (blog) => set((state) => ({ blogs: [blog, ...state.blogs] })),
  updateBlog: (blogId, updated) => set((state) => ({
    blogs: state.blogs.map((b) => b.id === blogId ? { ...b, ...updated } : b)
  })),
  deleteBlog: (blogId) => set((state) => ({
    blogs: state.blogs.filter((b) => b.id !== blogId)
  })),

  setNotes: (notes) =>
    set((state) => ({
      notes: typeof notes === "function"
        ? notes(state.notes)
        : notes,
    })),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (noteId, updated) => set((state) => ({
    notes: state.notes.map((n) => n.id === noteId ? { ...n, ...updated } : n)
  })),
  deleteNote: (noteId) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== noteId)
  })),
}));
