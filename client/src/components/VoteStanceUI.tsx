'use client';

import { useState, useEffect } from 'react';
import { vote, setStance, getUserVote, getUserStance } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface VoteStanceUIProps {
    theoryId: string;
    stats?: {
        upvotes: number;
        downvotes: number;
        for_count: number;
        against_count: number;
    } | null;
}

/**
 * Vote and Stance UI - Independent debate mechanics
 * Minimal, text-based, non-gamified
 */
export default function VoteStanceUI({ theoryId, stats }: VoteStanceUIProps) {
    const { user } = useAuth();
    const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
    const [userStance, setUserStance] = useState<'for' | 'against' | null>(null);
    const [localStats, setLocalStats] = useState(stats || {
        upvotes: 0,
        downvotes: 0,
        for_count: 0,
        against_count: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            // Fetch user's current vote and stance
            getUserVote(theoryId).then(data => setUserVote(data.vote));
            getUserStance(theoryId).then(data => setUserStance(data.stance));
        }
    }, [user, theoryId]);

    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (!user || loading) return;

        setLoading(true);
        try {
            await vote(theoryId, voteType);

            // Update local state
            const prevVote = userVote;
            setUserVote(voteType);

            // Update counts
            setLocalStats(prev => {
                const newStats = { ...prev };

                // Remove previous vote
                if (prevVote === 'upvote') newStats.upvotes--;
                if (prevVote === 'downvote') newStats.downvotes--;

                // Add new vote
                if (voteType === 'upvote') newStats.upvotes++;
                if (voteType === 'downvote') newStats.downvotes++;

                return newStats;
            });
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStance = async (stanceType: 'for' | 'against') => {
        if (!user || loading) return;

        setLoading(true);
        try {
            await setStance(theoryId, stanceType);

            // Update local state
            const prevStance = userStance;
            setUserStance(stanceType);

            // Update counts
            setLocalStats(prev => {
                const newStats = { ...prev };

                // Remove previous stance
                if (prevStance === 'for') newStats.for_count--;
                if (prevStance === 'against') newStats.against_count--;

                // Add new stance
                if (stanceType === 'for') newStats.for_count++;
                if (stanceType === 'against') newStats.against_count++;

                return newStats;
            });
        } catch (error) {
            console.error('Stance error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="text-sm text-text-tertiary">
                Sign in to participate in debate
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Vote section */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">VOTE:</span>
                <button
                    onClick={() => handleVote('upvote')}
                    disabled={loading}
                    className={`btn text-sm ${userVote === 'upvote' ? 'border-accent text-accent' : ''}`}
                >
                    ↑ {localStats.upvotes}
                </button>
                <button
                    onClick={() => handleVote('downvote')}
                    disabled={loading}
                    className={`btn text-sm ${userVote === 'downvote' ? 'border-accent text-accent' : ''}`}
                >
                    ↓ {localStats.downvotes}
                </button>
            </div>

            {/* Stance section */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">STANCE:</span>
                <button
                    onClick={() => handleStance('for')}
                    disabled={loading}
                    className={`btn text-sm ${userStance === 'for' ? 'border-accent text-accent' : ''}`}
                >
                    FOR {localStats.for_count}
                </button>
                <button
                    onClick={() => handleStance('against')}
                    disabled={loading}
                    className={`btn text-sm ${userStance === 'against' ? 'border-accent text-accent' : ''}`}
                >
                    AGAINST {localStats.against_count}
                </button>
            </div>
        </div>
    );
}
