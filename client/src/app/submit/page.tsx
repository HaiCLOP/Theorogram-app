'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTheory } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function SubmitPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [references, setReferences] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError('You must be signed in to submit a theory');
            return;
        }

        if (title.length < 10 || title.length > 200) {
            setError('Title must be between 10 and 200 characters');
            return;
        }

        if (body.length < 50) {
            setError('Theory body must be at least 50 characters');
            return;
        }

        setSubmitting(true);
        try {
            const data = await createTheory({ title, body, refs: references || undefined });

            // Check moderation result
            if (data.moderation.status === 'shadowbanned') {
                alert('Theory submitted but flagged for review: ' + data.moderation.message);
            } else if (data.moderation.status === 'safe') {
                alert('Theory published successfully!');
            }

            // Redirect to theory page
            router.push(`/theory/${data.theory.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to submit theory');
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="card p-8 text-center space-y-4">
                <h1 className="text-2xl">AUTHENTICATION REQUIRED</h1>
                <p className="text-text-secondary">You must be signed in to submit a theory</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl">SUBMIT THEORY</h1>
                <p className="text-sm text-text-secondary">
                    Publish a structured hypothesis backed by reasoning. No casual posts.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
                {/* Title */}
                <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm text-text-secondary">
                        THEORY TITLE <span className="text-text-tertiary">(10-200 characters)</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="A clear, descriptive title for your theory..."
                        className="input"
                        disabled={submitting}
                    />
                    <p className="text-xs text-text-tertiary">{title.length}/200</p>
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <label htmlFor="body" className="block text-sm text-text-secondary">
                        THEORY BODY <span className="text-text-tertiary">(minimum 50 characters)</span>
                    </label>
                    <textarea
                        id="body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Present your structured hypothesis with reasoning, evidence, and logical argumentation..."
                        className="input min-h-[300px] resize-y"
                        disabled={submitting}
                    />
                    <p className="text-xs text-text-tertiary">{body.length} characters</p>
                </div>

                {/* References */}
                <div className="space-y-2">
                    <label htmlFor="references" className="block text-sm text-text-secondary">
                        REFERENCES <span className="text-text-tertiary">(optional)</span>
                    </label>
                    <textarea
                        id="references"
                        value={references}
                        onChange={(e) => setReferences(e.target.value)}
                        placeholder="Citations, sources, or additional reading..."
                        className="input min-h-[100px] resize-y"
                        disabled={submitting}
                    />
                </div>

                {/* Error message */}
                {error && (
                    <div className="p-4 border border-status-banned bg-background-hover text-status-banned text-sm">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || title.length < 10 || body.length < 50}
                    className="btn-primary w-full"
                >
                    {submitting ? 'SUBMITTING...' : 'PUBLISH THEORY'}
                </button>

                <p className="text-xs text-text-tertiary text-center">
                    Your theory will be reviewed by AI moderation before publication. unsafe content will be blocked.
                </p>
            </form>
        </div>
    );
}
