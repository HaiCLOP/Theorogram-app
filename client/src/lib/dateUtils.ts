'use client';

/**
 * Format date as relative time (e.g., "2 hours ago", "3 days ago")
 * Falls back to absolute date for older content
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
        return 'just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks}w ago`;
    } else if (diffMonths < 12) {
        return `${diffMonths}mo ago`;
    } else if (diffYears < 2) {
        return `${diffYears}yr ago`;
    } else {
        // Fallback to absolute date for very old content
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
}

/**
 * Format date with full details
 */
export function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format date as short date (Jan 7, 2026)
 */
export function formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
