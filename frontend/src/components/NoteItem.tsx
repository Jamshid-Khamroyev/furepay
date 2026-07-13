import React, { useState, useRef, useEffect } from 'react';
import { Note, User } from '../types';
import { Heart, Trash2, Edit2, Check, X, Loader2, Image as ImageIcon, LoaderIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

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

  const getAvatarColor = (name: string) => {
    const colors = [
      '#8B6B4A', '#A67B5B', '#C4A882', '#B8926B', '#D4B89C',
      '#9C7B5E', '#BFA28A', '#D9C2B0', '#A68B72', '#C8AE96'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={`flex w-full items-end gap-2 py-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && (
        <div className="shrink-0 mb-1">
          <Link to={`/profile/${note.author.id}`}
            className="h-8 w-8 rounded-full cursor-pointer flex items-center justify-center text-white text-xs font-serif font-medium"
            style={{ backgroundColor: getAvatarColor(authorName) }}
          >
            {note.author.avatar ? (
              <img src={note.author.avatar} alt={note.author.username} className='rounded-full' />
            ) : (
              authorName.charAt(0).toUpperCase()
            )}
          </Link>
        </div>
      )}

      <div
        className={`relative group max-w-[85%] sm:max-w-[75%] px-3 py-1.5 shadow-sm transition-all duration-150 ${
          isOwn
            ? 'bg-amber-800 text-white rounded-2xl rounded-tr-sm'
            : 'bg-[#fffefb] text-amber-950 rounded-2xl rounded-tl-sm border border-amber-200/40'
        } ${deleting ? 'opacity-50' : ''}`}
      >
        {!isOwn && (
          <span className="block text-xs font-serif font-semibold text-amber-800 mb-0.5">
            {authorName}
          </span>
        )}

        {isEditing ? (
          <div className="space-y-2 min-w-[160px] sm:min-w-[200px]">
            <textarea
              ref={textareaRef}
              rows={1}
              disabled={saving}
              value={editingText}
              onChange={handleEditInputChange}
              onKeyDown={handleKeyDown}
              className="w-full border border-amber-200/40 rounded-lg bg-[#faf8f5] px-3 py-2 text-base sm:text-sm font-serif focus:outline-none focus:ring-1 focus:ring-amber-700 focus:border-amber-700 disabled:opacity-60 resize-none overflow-hidden transition-all text-amber-950 max-h-40"
              style={{ minHeight: '40px' }}
              placeholder="Edit note..."
            />

            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-serif font-medium transition-all cursor-pointer disabled:opacity-50 ${
                  isOwn
                    ? 'border-amber-700/40 text-amber-200 hover:bg-amber-800'
                    : 'border-amber-200/40 text-amber-700 hover:bg-amber-50'
                }`}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving || !editingText.trim() || editingText.trim() === note.content}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-serif font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {imageUrl && (
              <div className="relative rounded-lg overflow-hidden bg-[#faf8f5] max-w-full">
                {!imageLoaded && !imageError && (
                  <div className="flex items-center justify-center h-32 bg-[#faf8f5]">
                    <LoaderIcon className="h-6 w-6 animate-spin text-amber-600" />
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={note.content || 'Note image'}
                  className={`w-full max-h-[400px] object-contain rounded-lg transition-opacity duration-300 ${
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
                  <div className="flex flex-col items-center justify-center p-6 text-amber-700/40">
                    <ImageIcon className="h-8 w-8 mb-1 text-amber-700/30" />
                    <p className="text-xs font-serif">Failed to load image</p>
                  </div>
                )}
              </div>
            )}

            {note.content && (
              <div className={`text-sm leading-relaxed break-words whitespace-pre-wrap font-serif ${isOwn ? 'text-white' : 'text-amber-950'}`}>
                {note.content}
              </div>
            )}

            {!note.content && imageUrl && (
              <div className={`text-xs font-serif ${isOwn ? 'text-white/60' : 'text-amber-700/40'} italic`}>
                Shared an image
              </div>
            )}
          </div>
        )}

        {!isEditing && (
          <div className={`flex items-center justify-between mt-1 pt-1 border-t ${isOwn ? 'border-white/20' : 'border-amber-200/30'}`}>
            <div className="flex items-center gap-0.5">
              <button
                onClick={toggleLike}
                disabled={liking || !user}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg transition-all text-xs font-serif ${
                  !user
                    ? 'opacity-50 cursor-not-allowed'
                    : liked
                    ? 'text-red-500'
                    : isOwn
                    ? 'text-white/60 hover:text-white hover:bg-white/10'
                    : 'text-amber-700/40 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                {!liking && <Heart className={`h-4 w-4 ${liked ? 'fill-current text-red-600' : ''}`} />}
                <span>{liking ? <LoaderIcon className='w-4 h-4 animate-spin' /> : note.likes?.length || 0}</span>
              </button>

              {canEditDelete && (
                <>
                  <div className={`w-px h-4 ${isOwn ? 'bg-white/20' : 'bg-amber-200/30'} mx-0.5`} />
                  <button
                    onClick={handleStartEdit}
                    disabled={deleting}
                    className={`p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      isOwn
                        ? 'text-white/40 hover:text-white hover:bg-white/10'
                        : 'text-amber-700/40 hover:text-amber-900 hover:bg-amber-50'
                    }`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className={`p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      isOwn
                        ? 'text-white/40 hover:text-red-400 hover:bg-white/10'
                        : 'text-amber-700/40 hover:text-red-500 hover:bg-amber-50'
                    }`}
                  >
                    {deleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </>
              )}
            </div>

            <span className={`text-[10px] font-mono ${isOwn ? 'text-white/50' : 'text-amber-700/30'}`}>
              {formatTime(note.createdAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}