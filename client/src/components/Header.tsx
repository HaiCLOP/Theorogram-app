'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
    const { user, dbUser, loading, signOut } = useAuth();

    return (
        <header className="border-b border-border bg-background">
            <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-mono text-text-primary hover:text-accent transition-quiet">
                    THEOROGRAM
                </Link>

                <div className="flex items-center gap-6 text-sm">
                    <Link href="/submit" className="text-text-secondary hover:text-accent transition-quiet">
                        SUBMIT
                    </Link>
                    <Link href="/search" className="text-text-secondary hover:text-accent transition-quiet">
                        SEARCH
                    </Link>

                    {loading ? (
                        <span className="text-text-tertiary">...</span>
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            {/* Admin Link - Only shown to admins */}
                            {dbUser?.role === 'admin' && (
                                <Link href="/admin" className="text-red-400 hover:text-red-300 transition-quiet font-mono">
                                    🛡️ ADMIN
                                </Link>
                            )}
                            <Link href={`/profile/${user.displayName || user.email?.split('@')[0] || 'USER'}`} className="hover:text-accent transition-quiet">
                                <span className="text-text-secondary font-mono">
                                    {user.displayName || user.email?.split('@')[0] || 'USER'}
                                </span>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="btn text-status-banned border-status-banned hover:bg-status-banned hover:text-background"
                            >
                                SIGN OUT
                            </button>
                        </div>
                    ) : (
                        <Link href="/auth" className="btn-primary">
                            SIGN IN
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}

