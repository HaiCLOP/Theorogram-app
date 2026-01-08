'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTheories } from '@/lib/api';
import TheoryCard from '@/components/TheoryCard';
import { TheoryCardSkeleton } from '@/components/LoadingSkeletons';

export default function HomePage() {
    const [theories, setTheories] = useState<any[]>([]);
    const [sort, setSort] = useState<'latest' | 'popular'>('latest');
    const [loading, setLoading] = useState(true);

    // Memoize load function to prevent unnecessary re-renders
    const loadTheories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getTheories({ sort, limit: 20 });
            setTheories(data.theories || []);
        } catch (error) {
            console.error('Failed to load theories:', error);
        } finally {
            setLoading(false);
        }
    }, [sort]);

    useEffect(() => {
        loadTheories();
    }, [loadTheories]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl">GLOBAL FEED</h1>
                <p className="text-sm text-text-secondary">
                    Structured theories backed by reasoning. No casual posts.
                </p>
            </div>

            {/* Sort toggle */}
            <div className="flex gap-3">
                <button
                    onClick={() => setSort('latest')}
                    className={`btn ${sort === 'latest' ? 'border-accent text-accent' : ''}`}
                >
                    LATEST
                </button>
                <button
                    onClick={() => setSort('popular')}
                    className={`btn ${sort === 'popular' ? 'border-accent text-accent' : ''}`}
                >
                    POPULAR
                </button>
            </div>

            {/* Feed with loading skeletons */}
            <div className="space-y-6">
                {loading ? (
                    // Show 3 skeleton cards while loading
                    <>
                        <TheoryCardSkeleton />
                        <TheoryCardSkeleton />
                        <TheoryCardSkeleton />
                    </>
                ) : theories.length === 0 ? (
                    <p className="text-text-tertiary">No theories yet. Be the first to publish.</p>
                ) : (
                    theories.map((theory) => (
                        <TheoryCard key={theory.id} theory={theory} />
                    ))
                )}
            </div>
        </div>
    );
}
