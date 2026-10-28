import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { Note } from '../../types';
import { MessageSquare, Search, RefreshCw, Heart, Trash2 } from 'lucide-react';
import { Avatar } from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminNotesPage() {
  const { user } = useStore();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchNotes = async () => {
    setNotesLoading(true);
    try {
      const response = await api.get('/api/note');
      const data = response.data;
      const notesData = Array.isArray(data) ? data : data.notes || [];
      setNotes(notesData.sort((a: Note, b: Note) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (e) {
      toast.error('Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/blogs');
      return;
    }
    fetchNotes();
  }, [user, navigate]);

  const handleDelete = async (id: string, content: string) => {
    const preview = content.length > 30 ? content.slice(0, 30) + '...' : content;
    if (!window.confirm(`Delete note: "${preview}"?`)) return;
    setDeletingNoteId(id);
    try {
      await api.delete(`/api/note/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success('Note deleted');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const getAuthorName = (note: Note) => {
    if (typeof note.author === 'object' && note.author) {
      return note.author.username;
    }
    return 'Anonymous';
  };

  const getLikeCount = (note: Note) => {
    if (note._count?.likes !== undefined) return note._count.likes;
    if (Array.isArray(note.likes)) return note.likes.length;
    return 0;
  };

  const formatDate = (date: string) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffMs = now.getTime() - noteDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredNotes = notes.filter((note) => {
    const query = searchQuery.toLowerCase();
    const authorName = getAuthorName(note).toLowerCase();
    return (
      note.content.toLowerCase().includes(query) ||
      authorName.includes(query)
    );
  });

  const header = (
    <div className="mb-8 flex flex-col gap-5 border-b border-line pb-6 md:mb-10 md:flex-row md:items-end md:justify-between md:pb-8">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent-ink">Admin · Notes</p>
        <h1 className="mt-2 font-serif text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-ink md:text-[44px]">
          Notes
          {!notesLoading && (
            <span className="ml-3 align-middle font-mono text-[13px] font-normal tracking-normal text-muted">
              {notes.length}
            </span>
          )}
        </h1>
        <p className="mt-2 text-[15px] text-ink-2">Moderate short notes posted by members.</p>
      </div>

      <div className="relative w-full md:w-[300px]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-lg border border-line-strong bg-surface pl-10 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-ink md:h-[42px]"
          placeholder="Search..."
        />
      </div>
    </div>
  );

  if (notesLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-16 md:py-12">
        {header}
        <div className="flex min-h-[40vh] items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-16 md:py-12">
      {header}

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface text-muted">
            <MessageSquare className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="font-serif text-[22px] font-medium text-ink">No notes found</p>
          {searchQuery && <p className="mt-1 text-sm text-muted">Try a different search term.</p>}
        </div>
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {filteredNotes.map((note) => {
            const authorName = getAuthorName(note);
            const likeCount = getLikeCount(note);
            const avatar = typeof note.author === 'object' && note.author ? note.author.avatar : undefined;
            const isDeleting = deletingNoteId === note.id;

            return (
              <article
                key={note.id}
                className={`mb-5 break-inside-avoid rounded-xl border border-line bg-surface p-[18px] transition-opacity ${
                  isDeleting ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={authorName} src={avatar || undefined} size={28} />
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="truncate text-[14px] font-semibold text-ink">@{authorName}</span>
                    <span className="shrink-0 font-mono text-[12px] text-muted">{formatDate(note.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(note.id, note.content)}
                    disabled={isDeleting}
                    aria-label="Delete note"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger transition-[opacity,transform] hover:opacity-80 active:scale-[0.97] disabled:opacity-50 md:h-[30px] md:w-[30px]"
                  >
                    {isDeleting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {note.content && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
                    {note.content}
                  </p>
                )}

                {note.image && (
                  <img
                    src={note.image}
                    alt={note.content || 'Note image'}
                    loading="lazy"
                    className="mt-3 block max-h-[360px] w-full rounded-lg border border-line bg-surface-2 object-cover"
                  />
                )}

                <div className="mt-3.5 flex items-center gap-1.5 border-t border-line pt-3 font-mono text-[12px] text-muted">
                  <Heart className={`h-3.5 w-3.5 ${likeCount > 0 ? 'fill-current text-accent' : ''}`} />
                  <span>
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {filteredNotes.length > 0 && (
        <div className="mt-8 border-t border-line pt-4 text-center font-mono text-[12px] text-muted">
          Showing {filteredNotes.length} of {notes.length} notes
          {searchQuery && ` · Filtered by "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}
