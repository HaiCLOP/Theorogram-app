'use client';

import { useState, useEffect } from 'react';
import { getComments, createComment } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeText } from '@/lib/sanitize';
import ProfileBadge from './ProfileBadge';

interface CommentSectionProps {
    theoryId: string;
}

/**
 * Comment Section - Flat, text-only, argument-focused
 */
export default function CommentSection({ theoryId }: CommentSectionProps) {
    const { user } = useAuth();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadComments();
    }, [theoryId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await getComments(theoryId);
            setComments(data.comments || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user || !newComment.trim() || submitting) return;

        if (newComment.length < 10) {
            setError('Comment must be at least 10 characters');
            return;
        }

        setSubmitting(true);
        try {
            const data = await createComment(theoryId, newComment);
            setComments(prev => [...prev, data.comment]);
            setNewComment('');
        } catch (error: any) {
            setError(error.message || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-text-tertiary">Loading comments...</div>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg text-text-primary">COMMENTS ({comments.length})</h3>

            {/* Add comment form */}
            {user ? (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a reasoned argument (min. 10 characters)..."
                        className="input min-h-[100px] resize-y"
                        disabled={submitting}
                        maxLength={2000}
                    />
                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-text-tertiary">
                            {newComment.length}/2000 characters
                        </span>
                        <button
                            type="submit"
                            disabled={submitting || newComment.length < 10}
                            className="btn-primary"
                        >
                            {submitting ? 'POSTING...' : 'POST COMMENT'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-sm text-text-tertiary">Sign in to comment</p>
            )}

            {/* Comments list */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-sm text-text-tertiary">No comments yet. Be the first to contribute.</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="border-l-2 border-border pl-4 py-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <ProfileBadge
                                    username={comment.users.username}
                                    level={comment.users.level}
                                    size="small"
                                />
                                <time className="text-xs text-text-tertiary">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </time>
                            </div>
                            {/* SECURITY: Sanitize comment body */}
                            <p className="text-sm text-text-primary reading-width">
                                {sanitizeText(comment.body)}
                            </p>
                        </div>
                    ))
                )}

            </div>
        </div>
    );
}
