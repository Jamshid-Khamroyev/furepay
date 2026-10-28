import React, { useState, useRef, useEffect } from 'react';
import { Note, User } from '../types';
import { Heart, Trash2, Pencil, Check, X, Loader2, Image as ImageIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Avatar } from './Navbar';

interface NoteItemProps {
  note: Note;
  user: User | null;
  onUpdate: (noteId: string, content: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onLikeToggle: (noteId: string) => Promise<void>;
}

export default function NoteItem({ note, user, onUpdate, onDelete, onLikeToggle }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState(note.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const authorName = typeof note.author === 'object' && note.author ? note.author.username : 'Anonymous';
  const noteAuthorId = typeof note.author === 'object' && note.author ? note.author.id : '';

  const isOwn = user && user.id === noteAuthorId;
  const canEditDelete = user && (user.id === noteAuthorId || user.role === 'ADMIN');
  const liked = !!user && note?.likes?.some((like) => like.userId === user.id);
  const imageUrl = note.image;

  const resizeTextarea = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      resizeTextarea(textareaRef.current);
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditingText(note.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingText(note.content);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value);
    resizeTextarea(e.target);
  };

  const handleSaveEdit = async () => {
    const trimmed = editingText.trim();
    if (!trimmed || saving) return;
    if (trimmed === note.content) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onUpdate(note.id, trimmed);
      setIsEditing(false);
    } catch (e) {
      toast.error('Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(note.id);
    } catch (e) {
      toast.error('Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const toggleLike = async () => {
    if (!user) return;
    setLiking(true);
    try {
      await onLikeToggle(note.id);
    } catch (e) {
      toast.error('Failed to like note');
      console.log(e);
      
    } finally {
      setLiking(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (isToday) return timeStr;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${timeStr}`;
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${timeStr}`;
  };

  const iconBtn =
    'grid h-10 w-10 md:h-8 md:w-8 shrink-0 place-items-center rounded-lg transition-colors active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div
      className={`group flex w-full gap-3 transition-opacity ${
        isOwn ? 'rounded-xl border border-line bg-surface px-3 py-3 md:px-4' : 'px-3 py-3 md:px-4'
      } ${deleting ? 'opacity-50' : ''}`}
    >
      <Link
        to={`/profile/${note.author.id}`}
        className="mt-0.5 shrink-0 self-start rounded-full transition-opacity active:opacity-70"
        aria-label={`${authorName} profile`}
      >
        <Avatar name={authorName} src={note.author.avatar || undefined} size={36} />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-[3px]">
            <Link
              to={`/profile/${note.author.id}`}
              className="truncate text-[14px] font-semibold text-ink hover:underline underline-offset-2"
            >
              @{authorName}
            </Link>
            {isOwn && (
              <span className="rounded bg-surface-2 px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
                you
              </span>
            )}
            <span className="font-mono text-[12px] text-muted">{formatTime(note.createdAt)}</span>
          </div>

          {canEditDelete && !isEditing && (
            <div className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-0.5 md:-mt-0.5">
              <button
                type="button"
                onClick={handleStartEdit}
                disabled={deleting}
                aria-label="Edit note"
                className={`${iconBtn} text-muted hover:bg-surface-2 hover:text-ink`}
              >
                <Pencil className="h-4 w-4 md:h-[15px] md:w-[15px]" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete note"
                className={`${iconBtn} text-danger hover:bg-danger-soft`}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 md:h-[15px] md:w-[15px] animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 md:h-[15px] md:w-[15px]" />
                )}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              ref={textareaRef}
              rows={1}
              disabled={saving}
              value={editingText}
              onChange={handleEditInputChange}
              onKeyDown={handleKeyDown}
              className="block max-h-40 w-full resize-none overflow-hidden rounded-lg border-[1.5px] border-accent bg-bg px-3 py-2 text-[15px] leading-relaxed text-ink outline-none transition-colors placeholder:text-muted disabled:opacity-60"
              style={{ minHeight: '44px' }}
              placeholder="Edit note..."
            />

            <div className="flex items-center justify-between gap-2">
              <span className="hidden font-mono text-[11px] text-muted sm:inline">Esc to cancel · Enter to save</span>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink active:scale-[0.97] disabled:opacity-50 md:h-8"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving || !editingText.trim() || editingText.trim() === note.content}
                  className="inline-flex h-10 items-center gap-1 rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-bg transition-[opacity,transform] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 md:h-8"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {note.content && (
              <div className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
                {note.content}
              </div>
            )}

            {!note.content && imageUrl && (
              <div className="mt-1 text-[13px] italic text-muted">Shared an image</div>
            )}

            {imageUrl && (
              <div className="relative mt-2.5 max-w-[420px] overflow-hidden rounded-xl border border-line bg-surface-2">
                {!imageLoaded && !imageError && (
                  <div className="flex h-32 items-center justify-center">
                    <LoaderIcon className="h-5 w-5 animate-spin text-muted" />
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={note.content || 'Note image'}
                  className={`block max-h-[400px] w-full object-contain transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                  }}
                  loading="lazy"
                />
                {imageError && (
                  <div className="flex flex-col items-center justify-center p-6 text-muted">
                    <ImageIcon className="mb-1 h-7 w-7" strokeWidth={1.5} />
                    <p className="font-mono text-[11px]">Failed to load image</p>
                  </div>
                )}
              </div>
            )}

            <div className="-ml-2 mt-1.5 flex items-center">
              <button
                type="button"
                onClick={toggleLike}
                disabled={liking || !user}
                aria-pressed={liked}
                aria-label={liked ? 'Unlike note' : 'Like note'}
                className={`inline-flex h-10 min-w-[44px] items-center gap-1.5 rounded-lg px-2 transition-colors active:scale-[0.97] md:h-8 ${
                  !user
                    ? 'cursor-not-allowed opacity-50'
                    : liked
                    ? 'text-accent hover:bg-accent-soft'
                    : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {liking ? (
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                )}
                <span className="font-mono text-[12px]">{note.likes?.length || 0}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
