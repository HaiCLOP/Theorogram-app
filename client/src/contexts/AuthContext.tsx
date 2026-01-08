'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface DbUser {
    id: string;
    username: string;
    role: 'user' | 'admin';
    level: number;
    reputation_score: number;
}

interface AuthContextType {
    user: User | null;
    dbUser: DbUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [dbUser, setDbUser] = useState<DbUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                // Fetch user profile with role from backend
                try {
                    const token = await user.getIdToken();
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user.displayName || 'me'}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setDbUser(data.user);
                    }
                } catch (e) {
                    console.error('Error fetching user profile:', e);
                }
            } else {
                setDbUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        // Register user in backend
        const token = await userCredential.user.getIdToken();

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username })
        });
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setDbUser(null);
        router.push('/');
    };

    const getToken = async () => {
        if (!user) return null;
        return user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, dbUser, loading, signIn, signUp, signOut, getToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

