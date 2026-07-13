import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import NoteItem from '../components/NoteItem';
import { Send, Image, X, LoaderIcon, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { socket } from '../config/socket';
import { Note } from '../types';

export default function NotesPage() {
  const navigate = useNavigate();
  const { user, notes, setNotes, addNote, updateNote, deleteNote } = useStore();

  const [notesLoading, setNotesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentLimit, setCurrentLimit] = useState(10);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll management refs (don't trigger re-renders)
  // 'auto' | 'smooth' -> scroll to bottom after notes update; null -> do nothing
  const scrollToBottomRef = useRef<'auto' | 'smooth' | null>('auto');
  // when set, we restore the scroll offset instead of jumping anywhere (used by "load more")
  const loadMoreSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);

  const fetchNotes = async (limit: number) => {
    if (notesLoading) return;

    setNotesLoading(true);
    try {
      const response = await api.get('/api/note', { params: { limit } });
      const data = Array.isArray(response.data) ? response.data : response.data.notes || [];
      setNotes(data);
      setHasMore(data.length === limit);
      scrollToBottomRef.current = 'auto';
    } catch (e) {
      console.error('Failed to fetch notes:', e);
    } finally {
      setNotesLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    const container = containerRef.current;
    if (container) {
      loadMoreSnapshotRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
    }

    setLoadingMore(true);
    try {
      const newLimit = currentLimit + 10;
      const response = await api.get('/api/note', { params: { limit: newLimit } });
      const data = Array.isArray(response.data) ? response.data : response.data.notes || [];

      const existingIds = new Set(notes.map(n => n.id));
      const newNotes = data.filter(n => !existingIds.has(n.id));

      if (newNotes.length > 0) {
        const updatedNotes = [...notes, ...newNotes];
        setNotes(updatedNotes);
      } else {
        // nothing new arrived, no layout change coming, clear the snapshot
        loadMoreSnapshotRef.current = null;
      }

      setCurrentLimit(newLimit);
      setHasMore(data.length === newLimit);
    } catch (e) {
      console.error('Failed to load more notes:', e);
      loadMoreSnapshotRef.current = null;
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/notes', { replace: true });
      return;
    }
    setCurrentLimit(10);
    fetchNotes(10);
  }, [user, navigate]);

  // Runs after every notes change: either restore the pre-loadMore scroll offset
  // (so the view doesn't jump to the top) or scroll to the newest note.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (loadMoreSnapshotRef.current) {
      const { scrollHeight: oldHeight, scrollTop: oldTop } = loadMoreSnapshotRef.current;
      const newHeight = container.scrollHeight;
      container.scrollTop = oldTop + (newHeight - oldHeight);
      loadMoreSnapshotRef.current = null;
      return;
    }

    if (scrollToBottomRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: scrollToBottomRef.current });
      scrollToBottomRef.current = null;
    }
  }, [notes]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Rasm hajmi 5MB dan oshmasligi kerak');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Faqat rasm fayllar yuklashingiz mumkin');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!noteInput.trim() && !selectedImage) || submitting) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (noteInput.trim()) {
        formData.append('content', noteInput.trim());
      }
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await api.post('/api/note', formData);
      const newNote = response.data.note || response.data;

      addNote(newNote);
      setNoteInput('');
      removeImage();

      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }

      // scroll down to the note we just posted
      scrollToBottomRef.current = 'smooth';
    } catch (e: any) {
      console.error('Failed to add note:', e);
      toast.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await api.put(`/api/note/${noteId}`, { content });
      updateNote(noteId, { content });
    } catch (e: any) {
      console.error('Failed to update note:', e);
      throw e;
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/api/note/${noteId}`);
      deleteNote(noteId);
    } catch (e: any) {
      console.error('Failed to delete note:', e);
      throw e;
    }
  };

  const handleLikeToggle = async (noteId: string) => {
    if (!user) return;
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const liked = note.likes.some((like) => like.userId === user.id);

    try {
      if (liked) {
        await api.delete(`/api/note/${noteId}/like`);
        updateNote(noteId, {
          likes: note.likes.filter((like) => like.userId !== user.id)
        });
      } else {
        await api.post(`/api/note/${noteId}/like`);
        updateNote(noteId, {
          likes: [...note.likes, { userId: user.id }]
        });
      }
    } catch (e: any) {
      console.error('Failed to toggle like:', e);
      throw e;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // reached (or very near) the top -> automatically pull in 10 more notes
    if (target.scrollTop <= 40 && hasMore && !loadingMore && !notesLoading) {
      loadMore();
    }
  };

  const sortedNotes = [...notes].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  useEffect(() => {
    socket.on('note:created', (note: Note) => {
      if(note.author.id === user.id) return
      addNote(note);
      scrollToBottomRef.current = 'smooth';
    })

    socket.on('note:updated', (note: Note) => {
      if(note.authorId === user.id) return
      updateNote(note.id, { content: note.content });
    })

    socket.on('note:deleted', ({ id }: { id: string }) => {
      deleteNote(id);
    })

    socket.on("note:like", (like: { like: { userId: string }, noteId: string }) => {
      setNotes(prev =>
        prev.map(note =>
          note.id === like.noteId
            ? {
                ...note,
                likes: [...note.likes, { userId: like.like.userId }],
              }
            : note
        )
      );
    });
    
    socket.on("note:unlike", (like: { like: { userId: string }, noteId: string } ) => {
      setNotes(prev =>
        prev.map(note =>
          note.id === like.noteId
            ? {
                ...note,
                likes: note.likes.filter(l => l.userId !== like.like.userId),
              }
            : note
        )
      );
    });
  },[socket])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#faf8f5]">
      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3 max-w-6xl mx-auto w-full">
        {notesLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <LoaderIcon className="h-5 w-5 animate-spin text-amber-600" />
          </div>
        ) : (
          <>
            {sortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-[#fffefb] rounded-2xl p-8 shadow-sm border border-amber-200/40 max-w-sm w-full">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-amber-950 font-serif font-medium">No notes yet</p>
                  <p className="text-sm text-amber-700/60 font-serif mt-1">Write your first note below</p>
                </div>
              </div>
            ) : (
              <>
                {sortedNotes.length > 0 && (
                  <div className="flex justify-center py-4">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore || !hasMore}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <LoaderIcon className="h-4 w-4 animate-spin" />
                        </>
                      ) : hasMore ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                        </>
                      ) : (
                        'No more notes'
                      )}
                    </button>
                  </div>
                )}
                {sortedNotes.map((note) => (
                  <div key={note.id} className="mb-3">
                    <NoteItem
                      note={note}
                      user={user}
                      onUpdate={handleUpdateNote}
                      onDelete={handleDeleteNote}
                      onLikeToggle={handleLikeToggle}
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div
        className="bg-[#fffefb] border-t border-gray-200 px-3 pt-2 flex-shrink-0"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleSubmit}>
            {imagePreview && (
              <div className="relative inline-block mb-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 rounded-lg object-cover border border-amber-200/40"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 bg-[#faf8f5] border border-amber-200/40 rounded-2xl px-3 py-1.5">
              <textarea
                ref={inputRef}
                rows={1}
                disabled={submitting}
                value={noteInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a note..."
                className="flex-1 bg-transparent border-0 outline-none resize-none py-2 text-base sm:text-sm text-amber-950 placeholder-amber-700/40 font-serif min-h-[40px] max-h-32"
                style={{ height: 'auto' }}
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="p-2 rounded-full hover:bg-amber-100/50 cursor-pointer transition-colors"
                >
                  <Image className="h-5 w-5 text-amber-700/60" />
                </label>

                <button
                  type="submit"
                  disabled={submitting || (!noteInput.trim() && !selectedImage)}
                  className="p-2 rounded-full bg-amber-900 text-white hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <LoaderIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}