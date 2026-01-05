'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getUserProfile, getUserTheories } from '@/lib/api';
import NetworkCredential from '@/components/NetworkCredential';
import TheoryCard from '@/components/TheoryCard';

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;

    const [profile, setProfile] = useState<any>(null);
    const [theories, setTheories] = useState<any[]>([]);
    const [activity, setActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (username) {
            loadProfile();
        }
    }, [username]);

    const loadProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const [profileData, theoriesData] = await Promise.all([
                getUserProfile(username),
                getUserTheories(username).catch(() => ({ theories: [] })),
            ]);

            setProfile(profileData.user);
            setActivity(profileData.recent_activity || []);
            setTheories(theoriesData.theories || []);
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('User not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="text-text-tertiary font-mono">LOADING CREDENTIALS...</div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="space-y-8">
                <div className="text-red-400 font-mono">ACCESS DENIED: {error || 'User not found'}</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Network Credential Card */}
            <NetworkCredential
                username={profile.username}
                reputation={profile.reputation_score || 0}
                theoriesCount={theories.length}
                joinedAt={profile.created_at}
                banned_status={profile.banned_status}
                recentActivity={activity}
            />

            {/* User's Theories */}
            <div className="space-y-4">
                <h2 className="text-xl font-mono text-text-secondary">PUBLISHED THEORIES</h2>

                {theories.length === 0 ? (
                    <p className="text-text-tertiary font-mono">No theories published yet.</p>
                ) : (
                    <div className="space-y-4">
                        {theories.map((theory) => (
                            <TheoryCard key={theory.id} theory={theory} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
