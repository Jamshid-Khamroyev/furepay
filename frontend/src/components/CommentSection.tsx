import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Comment, Blog } from '../types';
import { Send } from 'lucide-react';
import { Avatar } from './Navbar';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// Short relative time ("5m ago"), falling back to an absolute date after a week
const formatCommentTime = (dateStr?: string): string => {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const diff = Math.max(0, Date.now() - date.getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

interface CommentSectionProps {
  blog: Blog;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

export default function CommentSection({ blog, comments, setComments }: CommentSectionProps) {
  const { user, updateBlog } = useStore();

  const [commentInput, setCommentInput] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !user || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const { data } = await api.post(`/api/blog/${blog.id}/comment`, { content: commentInput.trim() });
      setComments((prev: Comment[]) => [data.comment, ...prev])
      setCommentInput('');
      toast.success('Comment posted successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to post comment.';
      toast.error(msg);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleStartEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveComment = async (commentId: string) => {
    if (!editingCommentText.trim() || savingCommentId) return;
    setSavingCommentId(commentId);
    try {
      const { data } = await api.patch(`/api/blog/comment/${commentId}`, { content: editingCommentText.trim() });
      setComments(prev => prev.map(comment => {
        if(comment.id === data.comment.id){
          return data.comment
        }

        return comment
      }))
      setEditingCommentId(null);
      setEditingCommentText('');
      toast.success('Comment updated successfully!');
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to save comment.';
      toast.error(msg);
    } finally {
      setSavingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingCommentId(commentId);
    try {
      const { data } = await api.delete(`/api/blog/comment/${commentId}`);
      if(data.success){
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        toast.success('Comment deleted successfully!');
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Failed to delete comment.';
      toast.error(msg);
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <section id="comments" className="border-t border-line pt-10 mt-12 scroll-mt-[calc(var(--header-h)+16px)]">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-[28px] tracking-tight text-ink">Discussion</h2>
        <span className="font-mono text-xs text-muted">
          {comments?.length || 0} {(comments?.length || 0) === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      <div className="mt-6">
        {user ? (
          user.role !== 'ADMIN' && (
            <form
              onSubmit={handleAddComment}
              className="bg-surface border border-line-strong rounded-xl p-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition"
            >
              <textarea
                rows={3}
                required
                disabled={commentSubmitting}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Join the discussion. Write your comment..."
                className="block w-full resize-none bg-transparent border-0 p-1 text-base md:text-[15px] leading-relaxed text-ink placeholder:text-muted focus:outline-none disabled:opacity-60"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentInput.trim()}
                  className="inline-flex items-center gap-2 bg-ink text-bg font-semibold rounded-lg px-4 py-2.5 text-sm min-h-[44px] md:min-h-0 hover:opacity-90 active:scale-[0.97] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{commentSubmitting ? 'Posting...' : 'Post comment'}</span>
                </button>
              </div>
            </form>
          )
        ) : (
          <div className="bg-surface-2 rounded-xl p-4 text-center">
            <p className="text-sm text-ink-2">
              Please{' '}
              <Link to="/auth/signin" className="font-semibold text-ink underline underline-offset-2">
                sign in
              </Link>{' '}
              to add comments to this blog.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 divide-y divide-line">
        {comments && comments.length > 0 ? (
          comments.map((comment) => {
            const commentAuthorName =
              typeof comment.author === 'object' && comment.author ? comment.author.username : 'Anonymous';
            const commentAuthorId =
              typeof comment.author === 'object' && comment.author ? comment.author.id : '';
            const commentAuthorAvatar =
              typeof comment.author === 'object' && comment.author && 'avatar' in comment.author
                ? (comment.author as { avatar?: string }).avatar
                : undefined;
            const canEditComment = user && user.id === commentAuthorId && user.role !== 'ADMIN';
            const canDeleteComment = user && (user.id === commentAuthorId || user.role === 'ADMIN');
            const isEditing = editingCommentId === comment.id;

            const commentDate = formatCommentTime(comment.createdAt);
            const commentDateTitle = comment.createdAt
              ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown';

            return (
              <div key={comment.id} className="flex gap-3 py-5">
                <Avatar name={commentAuthorName} src={commentAuthorAvatar || undefined} size={30} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="truncate text-sm font-semibold text-ink">@{commentAuthorName}</span>
                      <span className="shrink-0 font-mono text-xs text-muted" title={commentDateTitle}>
                        {commentDate}
                      </span>
                    </div>

                    {!isEditing && (canEditComment || canDeleteComment) && (
                      <div className="flex items-center gap-1 shrink-0 -mr-2">
                        {canEditComment && (
                          <button
                            onClick={() => handleStartEditComment(comment.id, comment.content)}
                            disabled={!!deletingCommentId}
                            className="px-2 min-h-[36px] md:min-h-0 md:py-1 rounded-md text-xs font-medium text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={!!deletingCommentId}
                            className="px-2 min-h-[36px] md:min-h-0 md:py-1 rounded-md text-xs font-medium text-danger hover:bg-danger-soft cursor-pointer active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-2">
                      <textarea
                        rows={3}
                        disabled={savingCommentId === comment.id}
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        className="block w-full resize-none rounded-lg bg-surface border border-accent ring-2 ring-accent/20 px-3 py-2 text-base md:text-[15px] leading-relaxed text-ink focus:outline-none disabled:opacity-60"
                      />
                      <div className="mt-2 flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEditComment}
                          disabled={savingCommentId === comment.id}
                          className="px-3 py-2 rounded-lg text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface-2 cursor-pointer active:opacity-70 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveComment(comment.id)}
                          disabled={savingCommentId === comment.id || !editingCommentText.trim()}
                          className="px-3.5 py-2 rounded-lg bg-ink text-bg text-sm font-semibold hover:opacity-90 cursor-pointer active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savingCommentId === comment.id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </section>
  );
}
