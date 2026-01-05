'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getTheory } from '@/lib/api';
import ProfileBadge from '@/components/ProfileBadge';
import VoteStanceUI from '@/components/VoteStanceUI';
import CommentSection from '@/components/CommentSection';

export default function TheoryPage() {
    const params = useParams();
    const id = params.id as string;
    const [theory, setTheory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadTheory();
        }
    }, [id]);

    const loadTheory = async () => {
        setLoading(true);
        try {
            const data = await getTheory(id);
            setTheory(data.theory);
        } catch (error) {
            console.error('Failed to load theory:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-text-tertiary">Loading theory...</div>;
    }

    if (!theory) {
        return <div className="text-text-tertiary">Theory not found</div>;
    }

    const timestamp = new Date(theory.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="space-y-8">
            {/* Theory content */}
            <article className="card p-8 space-y-6">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl">{theory.title}</h1>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                        <ProfileBadge
                            username={theory.users?.username || 'Unknown'}
                            level={theory.users?.level || 1}
                            size="small"
                        />
                        <time className="text-sm text-text-tertiary">{timestamp}</time>
                    </div>
                </div>

                {/* Body */}
                <div className="space-y-4">
                    <div className="prose prose-invert max-w-none">
                        <p className="text-base text-text-primary leading-relaxed whitespace-pre-wrap">
                            {theory.body}
                        </p>
                    </div>

                    {/* References */}
                    {theory.refs && (
                        <div className="pt-4 border-t border-border-subtle">
                            <h3 className="text-sm text-text-secondary mb-2">REFERENCES</h3>
                            <p className="text-sm text-text-tertiary whitespace-pre-wrap">
                                {theory.refs}
                            </p>
                        </div>
                    )}
                </div>

                {/* Vote & Stance UI */}
                <div className="pt-6 border-t border-border">
                    <VoteStanceUI
                        theoryId={theory.id}
                        stats={theory.theory_stats}
                    />
                </div>
            </article>

            {/* Comments */}
            <div className="card p-8">
                <CommentSection theoryId={theory.id} />
            </div>
        </div>
    );
}
