import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../api';
import { Note } from '../../types';
import { 
  MessageSquare, Search, RefreshCw, 
  Heart, Trash2, User, Clock
} from 'lucide-react';
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

  if (notesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-600" />
          <h1 className="text-lg font-semibold text-neutral-900">Notes</h1>
          <span className="text-sm text-neutral-400 ml-1">({notes.length})</span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 pl-9 pr-3 py-1.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-400">No notes found</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const authorName = getAuthorName(note);
            const likeCount = getLikeCount(note);

            return (
              <div key={note.id} className="group">
                {/* Note Item */}
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-semibold text-sm">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-900">
                        @{authorName}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>

                    <div className="bg-neutral-50 rounded-2xl px-4 py-3">
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                        {note.content}
                      </p>
                      {note.image && (
                        <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1">
                          📎 Image attached
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-1.5 text-xs">
                      <button 
                        className="flex items-center gap-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        <Heart className={`h-3.5 w-3.5 ${likeCount > 0 ? 'text-red-400 fill-red-400' : ''}`} />
                        {likeCount && <span className="text-neutral-500">{likeCount}</span>}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(note.id, note.content)}
                        disabled={deletingNoteId === note.id}
                        className="text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingNoteId === note.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {filteredNotes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-neutral-200 text-xs text-neutral-400 text-center">
          Showing {filteredNotes.length} of {notes.length} notes
          {searchQuery && ` · Filtered by "${searchQuery}"`}
        </div>
      )}
    </div>
  );
}