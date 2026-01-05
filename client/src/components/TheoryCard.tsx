import Link from 'next/link';
import ProfileBadge from './ProfileBadge';

interface TheoryCardProps {
    theory: {
        id: string;
        title: string;
        body: string;
        created_at: string;
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
 */
export default function TheoryCard({ theory }: TheoryCardProps) {
    const preview = theory.body.substring(0, 200) + (theory.body.length > 200 ? '...' : '');
    const timestamp = new Date(theory.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    // Default stats if not yet populated
    const stats = theory.theory_stats || {
        upvotes: 0,
        downvotes: 0,
        for_count: 0,
        against_count: 0,
        comment_count: 0,
    };

    return (
        <article className="card p-6 space-y-4">
            {/* Author info */}
            <div className="flex items-center justify-between">
                <ProfileBadge
                    username={theory.users?.username || 'Unknown'}
                    level={theory.users?.level || 1}
                    size="small"
                />
                <time className="text-xs text-text-tertiary">{timestamp}</time>
            </div>

            {/* Theory content */}
            <div className="space-y-2">
                <Link href={`/theory/${theory.id}`}>
                    <h3 className="text-lg text-text-primary hover:text-accent transition-quiet">
                        {theory.title}
                    </h3>
                </Link>
                <p className="text-sm text-text-secondary reading-width">
                    {preview}
                </p>
            </div>

            {/* Interaction counts - non-gamified, text-based */}
            <div className="flex gap-6 text-xs text-text-tertiary pt-2 border-t border-border-subtle">
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
