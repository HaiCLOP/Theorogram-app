'use client';

import { useState, useEffect } from 'react';
import { vote, setStance, getUserVote, getUserStance, removeVote } from '@/lib/api';
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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            // Fetch user's current vote and stance
            getUserVote(theoryId).then(data => setUserVote(data.vote));
            getUserStance(theoryId).then(data => setUserStance(data.stance));
        }
    }, [user, theoryId]);

    // Auto-clear errors after 3 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleVote = async (voteType: 'upvote' | 'downvote') => {
        if (!user || loading) return;
        setError(null);

        setLoading(true);
        try {
            const prevVote = userVote;

            // If clicking the same vote, remove it (toggle off)
            if (prevVote === voteType) {
                await removeVote(theoryId);
                setUserVote(null);

                // Update counts - remove the vote
                setLocalStats(prev => ({
                    ...prev,
                    upvotes: voteType === 'upvote' ? prev.upvotes - 1 : prev.upvotes,
                    downvotes: voteType === 'downvote' ? prev.downvotes - 1 : prev.downvotes,
                }));
            } else {
                // Otherwise, add or change vote
                await vote(theoryId, voteType);
                setUserVote(voteType);

                // Update counts
                setLocalStats(prev => {
                    const newStats = { ...prev };

                    // Remove previous vote if any
                    if (prevVote === 'upvote') newStats.upvotes--;
                    if (prevVote === 'downvote') newStats.downvotes--;

                    // Add new vote
                    if (voteType === 'upvote') newStats.upvotes++;
                    if (voteType === 'downvote') newStats.downvotes++;

                    return newStats;
                });
            }
        } catch (err: any) {
            // Show user-friendly error message
            setError(err.message || 'Failed to vote');
        } finally {
            setLoading(false);
        }
    };

    const handleStance = async (stanceType: 'for' | 'against') => {
        if (!user || loading) return;
        setError(null);

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
        } catch (err: any) {
            setError(err.message || 'Failed to set stance');
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
            {/* Error message */}
            {error && (
                <div className="p-2 text-sm text-red-400 border border-red-400/50 bg-red-400/10 rounded">
                    ⚠ {error}
                </div>
            )}
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
