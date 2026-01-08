import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
}

/**
 * API fetch wrapper with auth
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = await getAuthToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

// ============================================
// THEORIES
// ============================================

export async function createTheory(data: { title: string; body: string; refs?: string }) {
    return apiFetch('/api/theories', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getTheories(params?: { sort?: 'latest' | 'popular'; limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/theories?${query}`);
}

export async function getTheory(id: string) {
    return apiFetch(`/api/theories/${id}`);
}

// ============================================
// VOTES
// ============================================

export async function vote(theory_id: string, vote_type: 'upvote' | 'downvote') {
    return apiFetch('/api/votes', {
        method: 'POST',
        body: JSON.stringify({ theory_id, vote_type }),
    });
}

export async function getUserVote(theoryId: string) {
    return apiFetch(`/api/votes/user/${theoryId}`);
}

export async function removeVote(theoryId: string) {
    return apiFetch(`/api/votes/${theoryId}`, {
        method: 'DELETE',
    });
}

// ============================================
// STANCES
// ============================================

export async function setStance(theory_id: string, stance_type: 'for' | 'against') {
    return apiFetch('/api/stances', {
        method: 'POST',
        body: JSON.stringify({ theory_id, stance_type }),
    });
}

export async function getUserStance(theoryId: string) {
    return apiFetch(`/api/stances/user/${theoryId}`);
}

// ============================================
// COMMENTS
// ============================================

export async function createComment(theory_id: string, body: string) {
    return apiFetch('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ theory_id, body }),
    });
}

export async function getComments(theoryId: string) {
    return apiFetch(`/api/comments/${theoryId}`);
}

export async function deleteComment(id: string) {
    return apiFetch(`/api/comments/${id}`, {
        method: 'DELETE',
    });
}

// ============================================
// USERS
// ============================================

export async function getUserProfile(username: string) {
    return apiFetch(`/api/users/${username}`);
}

export async function getUserTheories(username: string, params?: { sort?: 'most_upvoted' | 'popular' | 'recent' }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/users/${username}/theories?${query}`);
}

// ============================================
// SEARCH
// ============================================

export async function search(q: string, type: 'all' | 'theories' | 'users' = 'all') {
    const query = new URLSearchParams({ q, type }).toString();
    return apiFetch(`/api/search?${query}`);
}

export async function searchTheories(q: string) {
    return search(q, 'theories');
}

// ============================================
// ADMIN
// ============================================

export async function deleteTheory(id: string, reason?: string) {
    return apiFetch(`/api/admin/theories/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
    });
}

export async function banUser(id: string, reason?: string) {
    return apiFetch(`/api/admin/users/${id}/ban`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function unbanUser(id: string, reason?: string) {
    return apiFetch(`/api/admin/users/${id}/unban`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function getModerationLogs(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/admin/moderation-logs?${query}`);
}

export async function getAuditLogs(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/admin/audit-logs?${query}`);
}

export async function flagTheoryMature(id: string, reason?: string) {
    return apiFetch(`/api/admin/theories/${id}/flag-mature`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
    });
}

export async function unflagTheoryMature(id: string) {
    return apiFetch(`/api/admin/theories/${id}/unflag-mature`, {
        method: 'POST',
    });
}

// ============================================
// USER PREFERENCES  
// ============================================

// Store hidden theories in localStorage for now (could be moved to backend)
export function getHiddenTheories(): string[] {
    if (typeof window === 'undefined') return [];
    const hidden = localStorage.getItem('hidden_theories');
    return hidden ? JSON.parse(hidden) : [];
}

export function hideTheory(theoryId: string): void {
    const hidden = getHiddenTheories();
    if (!hidden.includes(theoryId)) {
        hidden.push(theoryId);
        localStorage.setItem('hidden_theories', JSON.stringify(hidden));
    }
}

export function isTheoryHidden(theoryId: string): boolean {
    return getHiddenTheories().includes(theoryId);
}

