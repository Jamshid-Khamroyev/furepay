import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import NoteItem from '../components/NoteItem';
import { ArrowUp, ImagePlus, X, LoaderIcon, RefreshCw, MessageSquareText } from 'lucide-react';
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
    <div className="fixed inset-x-0 top-[var(--header-h)] bottom-[var(--nav-h)] flex flex-col overflow-hidden bg-bg">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col px-3 py-3 md:px-0">
          {notesLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : sortedNotes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface text-muted">
                <MessageSquareText className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="font-serif text-[22px] font-medium text-ink">No notes yet</p>
              <p className="mt-1 text-sm text-muted">Write your first note below</p>
            </div>
          ) : (
            <>
              <div className="mt-auto flex justify-center py-3">
                <button
                  onClick={loadMore}
                  disabled={loadingMore || !hasMore}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink active:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  {loadingMore ? (
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                  ) : hasMore ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Load older notes
                    </>
                  ) : (
                    <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">No more notes</span>
                  )}
                </button>
              </div>

              {sortedNotes.map((note, idx) => {
                const prev = sortedNotes[idx - 1];
                const showDay = !prev || dayKey(prev.createdAt) !== dayKey(note.createdAt);
                return (
                  <React.Fragment key={note.id}>
                    {showDay && <DaySeparator date={note.createdAt} />}
                    <div className="mb-1.5">
                      <NoteItem
                        note={note}
                        user={user}
                        onUpdate={handleUpdateNote}
                        onDelete={handleDeleteNote}
                        onLikeToggle={handleLikeToggle}
                      />
                    </div>
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-line bg-surface px-3 py-2.5 md:px-4 md:pb-4">
        <div className="mx-auto max-w-[760px]">
          <form onSubmit={handleSubmit}>
            {imagePreview && (
              <div className="mb-2.5 flex items-center gap-3 rounded-xl border border-line bg-bg p-2 pr-1.5">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-14 w-14 shrink-0 rounded-lg border border-line object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{selectedImage?.name || 'Image'}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">
                    {selectedImage ? formatBytes(selectedImage.size) : ''} · max 5 MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  aria-label="Remove image"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink active:scale-[0.97]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-1.5 rounded-[24px] border border-line-strong bg-bg p-1 md:rounded-xl md:p-1.5">
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
                aria-label="Attach image"
                className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink active:scale-[0.97] md:h-10 md:w-10 md:rounded-lg"
              >
                <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
              </label>

              <textarea
                ref={inputRef}
                rows={1}
                disabled={submitting}
                value={noteInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Write a note..."
                className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent py-[11px] text-[15px] leading-[22px] text-ink outline-none placeholder:text-muted md:min-h-[40px] md:py-[9px]"
                style={{ height: 'auto' }}
              />

              <button
                type="submit"
                aria-label="Send note"
                disabled={submitting || (!noteInput.trim() && !selectedImage)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-on-accent transition-[opacity,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 md:h-10 md:w-10 md:rounded-lg"
              >
                {submitting ? (
                  <LoaderIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5" strokeWidth={2.25} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function dayKey(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toDateString();
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' as const } : {}),
  });
}

function DaySeparator({ date }: { date: string }) {
  return (
    <div className="my-3 flex items-center gap-3 px-1" role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">{dayLabel(date)}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
