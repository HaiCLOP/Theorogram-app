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

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signOut: () => Promise<void>;
    getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                // Ensure user exists in backend
                try {
                    const token = await user.getIdToken();
                    // We can trigger a profile fetch to ensure syncing happens
                    // fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });
                } catch (e) {
                    console.error('Error syncing user:', e);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, username: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        // We need to pass the username to the backend to create the user record
        // The backend middleware will likely create the user, but it needs the username.
        // Since verifyIdToken only gives us UID/email, we might need a specific "register" endpoint 
        // or pass username in a header during the first call.

        // For simplicity, let's assume we call a registration endpoint immediately
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
        router.push('/');
    };

    const getToken = async () => {
        if (!user) return null;
        return user.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken }}>
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
