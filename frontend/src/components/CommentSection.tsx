import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api';
import { Comment, Blog } from '../types';
import { MessageSquare, Send, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

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
    <section className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-neutral-850" />
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 font-serif">
          Comments ({comments?.length || 0})
        </h2>
      </div>

      {user ? (
        user.role !== 'ADMIN' && (
          <form onSubmit={handleAddComment} className="bg-white border border-amber-200/50 rounded-lg p-4 space-y-3">
            <textarea
              rows={3}
              required
              disabled={commentSubmitting}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Join the discussion. Write your comment..."
              className="block w-full px-3 py-2 border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 rounded-lg focus:outline-none text-sm text-neutral-800 bg-white disabled:opacity-60 disabled:bg-neutral-50"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={commentSubmitting || !commentInput.trim()}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-900 text-white rounded font-semibold text-xs hover:bg-amber-800 cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="h-3 w-3" />
                <span>{commentSubmitting ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-4 text-center">
          <p className="text-sm text-neutral-600 font-serif">
            Please{' '}
            <Link to="/auth/signin" className="font-semibold text-amber-955 underline">
              sign in
            </Link>{' '}
            to add comments to this blog.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments && comments.length > 0 ? (
          comments.map((comment) => {
            const commentAuthorName =
              typeof comment.author === 'object' && comment.author ? comment.author.username : 'Anonymous';
            const commentAuthorId =
              typeof comment.author === 'object' && comment.author ? comment.author.id : '';
            const canEditComment = user && user.id === commentAuthorId && user.role !== 'ADMIN';
            const canDeleteComment = user && (user.id === commentAuthorId || user.role === 'ADMIN');
            const isEditing = editingCommentId === comment.id;

            const commentDate = comment.createdAt
              ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Unknown';

            return (
              <div key={comment.id} className="bg-white border border-amber-200 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <div className="flex items-center space-x-1.5 font-sans font-medium text-amber-955">
                    <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center font-bold text-[10px] text-amber-800">
                      {(commentAuthorName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span>@{commentAuthorName}</span>
                    <span className="text-neutral-400 font-normal">({commentDate})</span>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center space-x-2">
                      {canEditComment && (
                        <button
                          onClick={() => handleStartEditComment(comment.id, comment.content)}
                          disabled={!!deletingCommentId}
                          className="text-neutral-500 hover:text-amber-900 flex items-center space-x-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDeleteComment && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={!!deletingCommentId}
                          className="text-red-500 hover:text-red-700 flex items-center space-x-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{deletingCommentId === comment.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      disabled={savingCommentId === comment.id}
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="block w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm text-neutral-800 disabled:opacity-60 disabled:bg-neutral-50"
                    />
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={handleCancelEditComment}
                        disabled={savingCommentId === comment.id}
                        className="px-2.5 py-1.5 border border-neutral-300 rounded text-xs font-semibold text-neutral-750 hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveComment(comment.id)}
                        disabled={savingCommentId === comment.id || !editingCommentText.trim()}
                        className="px-2.5 py-1.5 bg-amber-900 text-white rounded text-xs font-semibold hover:bg-amber-850 cursor-pointer disabled:bg-neutral-300"
                      >
                        {savingCommentId === comment.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed font-serif">
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-neutral-550 text-sm font-serif text-center py-6 bg-white border border-amber-100 rounded-lg">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </section>
  );
}
