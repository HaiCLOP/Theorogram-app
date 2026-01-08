'use client';

import { memo, useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileBadge from './ProfileBadge';
import { sanitizeText, sanitizePreview } from '@/lib/sanitize';
import { formatRelativeTime } from '@/lib/dateUtils';
import { useAuth } from '@/contexts/AuthContext';

interface TheoryCardProps {
    theory: {
        id: string;
        title: string;
        body: string;
        created_at: string;
        is_mature?: boolean;
        users: {
            username: string;
            level: number;
        };
        theory_stats?: {
            upvotes: number;
            downvotes: number;
            for_count: number;
            against_count: number;
            comment_count: number;
        } | null;
    };
}

/**
 * Theory Card for feed display
 * Reading-first, calm, minimal
 * Wrapped with React.memo for performance
 */
function TheoryCard({ theory }: TheoryCardProps) {
    const { dbUser } = useAuth();
    const [showMature, setShowMature] = useState(false);

    // Check if mature content should be shown by default (admin or accepted)
    // For feed, we always default to hidden if mature, unless admin
    const isMatureContent = theory.is_mature;
    const isAdmin = dbUser?.role === 'admin';
    const shouldBlur = isMatureContent && !showMature;

    // SECURITY: Sanitize user-generated content
    const sanitizedTitle = sanitizeText(theory.title);
    const preview = sanitizePreview(theory.body, 200);

    // Use relative time for better UX
    const timestamp = formatRelativeTime(theory.created_at);

    // Default stats if not yet populated
    const stats = theory.theory_stats || {
        upvotes: 0,
        downvotes: 0,
        for_count: 0,
        against_count: 0,
        comment_count: 0,
    };

    return (
        <article className={`card p-6 space-y-4 relative ${shouldBlur ? 'overflow-hidden' : ''}`}>
            {/* Mature Content Warning Overlay */}
            {shouldBlur && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm transition-all duration-300">
                    <div className="text-center space-y-3 p-4">
                        <div className="w-16 h-16 rounded-full border-2 border-status-warning flex items-center justify-center mb-2">
                            <span className="text-xl font-bold text-status-warning font-mono">18+</span>
                        </div>
                        <h3 className="text-status-warning font-mono text-lg">Mature Content</h3>
                        <p className="text-text-secondary text-sm max-w-xs mx-auto">
                            This theory has been flagged as mature content.
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setShowMature(true);
                            }}
                            className="btn border-status-warning text-status-warning hover:bg-status-warning/10"
                        >
                            SHOW CONTENT
                        </button>
                    </div>
                </div>
            )}

            {/* Author info */}
            <div className={`flex items-center justify-between ${shouldBlur ? 'blur-sm grayscale opacity-50' : ''}`}>
                <ProfileBadge
                    username={theory.users?.username || 'Unknown'}
                    level={theory.users?.level || 1}
                    size="small"
                />
                <time className="text-xs text-text-tertiary">{timestamp}</time>
            </div>

            {/* Theory content */}
            <div className={`space-y-2 ${shouldBlur ? 'blur-sm grayscale opacity-50 select-none pointer-events-none' : ''}`}>
                <Link href={`/theory/${theory.id}`}>
                    <h3 className="text-lg text-text-primary hover:text-accent transition-quiet">
                        {isMatureContent && <span className="text-status-warning mr-2 text-xs border border-status-warning px-1.5 py-0.5 rounded align-middle font-mono font-bold tracking-wider">MATURE</span>}
                        {sanitizedTitle}
                    </h3>
                </Link>
                <p className="text-sm text-text-secondary reading-width">
                    {preview}
                </p>
            </div>

            {/* Interaction counts - non-gamified, text-based */}
            <div className={`flex gap-6 text-xs text-text-tertiary pt-2 border-t border-border-subtle ${shouldBlur ? 'blur-sm grayscale opacity-50' : ''}`}>
                <div className="metric">
                    <span>↑ {stats.upvotes}</span>
                </div>
                <div className="metric">
                    <span>↓ {stats.downvotes}</span>
                </div>
                <div className="metric">
                    <span>FOR {stats.for_count}</span>
                </div>
                <div className="metric">
                    <span>AGAINST {stats.against_count}</span>
                </div>
                <div className="metric">
                    <span>💬 {stats.comment_count}</span>
                </div>
            </div>
        </article>
    );
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(TheoryCard);

