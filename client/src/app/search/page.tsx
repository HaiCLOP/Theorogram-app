'use client';

import { useState } from 'react';
import { searchTheories } from '@/lib/api';
import TheoryCard from '@/components/TheoryCard';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const data = await searchTheories(query);
            setResults(data.theories || []);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl">SEARCH</h1>
                <p className="text-sm text-text-secondary">
                    Find theories by title or content.
                </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter search terms..."
                    className="input flex-1"
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'SEARCHING...' : 'SEARCH'}
                </button>
            </form>

            <div className="space-y-6">
                {loading ? (
                    <p className="text-text-tertiary">Searching...</p>
                ) : searched && results.length === 0 ? (
                    <p className="text-text-tertiary">No theories found matching "{query}"</p>
                ) : (
                    results.map((theory) => (
                        <TheoryCard key={theory.id} theory={theory} />
                    ))
                )}
            </div>
        </div>
    );
}
