'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signin') {
                await signIn(email, password);
            } else {
                if (!username) throw new Error('Username is required');
                await signUp(email, password, username);
            }
            router.push('/');
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use');
            } else {
                setError(err.message || 'Authentication failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-16">
            <div className="card p-8 space-y-6">
                <div className="flex gap-4 border-b border-border mb-6">
                    <button
                        className={`pb-2 text-sm font-mono transition-colors ${mode === 'signin'
                                ? 'text-accent border-b-2 border-accent'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                        onClick={() => setMode('signin')}
                    >
                        SIGN IN
                    </button>
                    <button
                        className={`pb-2 text-sm font-mono transition-colors ${mode === 'signup'
                                ? 'text-accent border-b-2 border-accent'
                                : 'text-text-secondary hover:text-text-primary'
                            }`}
                        onClick={() => setMode('signup')}
                    >
                        SIGN UP
                    </button>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl">
                        {mode === 'signin' ? 'WELCOME BACK' : 'JOIN THEOROGRAM'}
                    </h1>
                    <p className="text-sm text-text-secondary">
                        {mode === 'signin'
                            ? 'Enter the realm of structured discourse.'
                            : 'Create an identity. Ideas over people.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs text-text-secondary">EMAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs text-text-secondary">PASSWORD</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input w-full"
                            required
                            minLength={6}
                        />
                    </div>

                    {mode === 'signup' && (
                        <div className="space-y-2">
                            <label className="block text-xs text-text-secondary">USERNAME</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input w-full"
                                required
                                minLength={3}
                                pattern="^[a-zA-Z0-9_]+$"
                                title="Alphanumeric and underscores only"
                            />
                            <p className="text-xs text-text-tertiary">
                                Your permanent identity. No profile photos.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 border border-status-banned text-status-banned text-xs bg-background-hover">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'PROCESSING...' : (mode === 'signin' ? 'AUTHENTICATE' : 'INITIALIZE IDENTITY')}
                    </button>
                </form>
            </div>
        </div>
    );
}
