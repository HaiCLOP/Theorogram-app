'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTheory } from '@/lib/api';
import { sanitizeText } from '@/lib/sanitize';
import { useAuth } from '@/contexts/AuthContext';
import ProfileBadge from '@/components/ProfileBadge';
import VoteStanceUI from '@/components/VoteStanceUI';
import CommentSection from '@/components/CommentSection';
import { TheoryDetailSkeleton } from '@/components/LoadingSkeletons';
import MatureContentWarning from '@/components/MatureContentWarning';
import AdminControls from '@/components/AdminControls';

export default function TheoryPage() {
    const params = useParams();
    const router = useRouter();
    const { user, dbUser } = useAuth();
    const id = params.id as string;
    const [theory, setTheory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [matureAccepted, setMatureAccepted] = useState(false);

    const isAdmin = dbUser?.role === 'admin';

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
        return <TheoryDetailSkeleton />;
    }

    if (!theory) {
        return <div className="text-text-tertiary">Theory not found</div>;
    }

    // Show mature content warning if theory is flagged and user hasn't accepted
    if (theory.is_mature && !matureAccepted && !isAdmin) {
        return (
            <MatureContentWarning
                theoryId={theory.id}
                onAccept={() => setMatureAccepted(true)}
                onHide={() => router.push('/')}
            />
        );
    }

    // SECURITY: Sanitize user-generated content
    const sanitizedTitle = sanitizeText(theory.title);
    const sanitizedBody = sanitizeText(theory.body);
    const sanitizedRefs = theory.refs ? sanitizeText(theory.refs) : null;

    const timestamp = new Date(theory.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="space-y-8">
            {/* Admin Controls (only visible to admins) */}
            {isAdmin && (
                <AdminControls
                    theoryId={theory.id}
                    isMature={theory.is_mature}
                    onDeleted={() => router.push('/')}
                    onFlagChanged={(isMature) => setTheory({ ...theory, is_mature: isMature })}
                />
            )}

            {/* Mature content banner */}
            {theory.is_mature && (
                <div className="p-3 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm rounded flex items-center gap-2">
                    <span>🔞</span>
                    <span>This theory contains mature content</span>
                </div>
            )}

            {/* Theory content */}
            <article className="card p-8 space-y-6">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-3xl">{sanitizedTitle}</h1>

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
                            {sanitizedBody}
                        </p>
                    </div>

                    {/* References */}
                    {sanitizedRefs && (
                        <div className="pt-4 border-t border-border-subtle">
                            <h3 className="text-sm text-text-secondary mb-2">REFERENCES</h3>
                            <p className="text-sm text-text-tertiary whitespace-pre-wrap">
                                {sanitizedRefs}
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
