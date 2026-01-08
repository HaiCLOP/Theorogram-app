'use client';

import DOMPurify from 'dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * SECURITY: All user content must pass through this before rendering
 */
export function sanitizeText(content: string): string {
    if (typeof window === 'undefined') {
        // Server-side: basic HTML entity encoding
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    // Client-side: use DOMPurify
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [],
    });
}

/**
 * Sanitize content that may contain limited HTML (for future use)
 */
export function sanitizeHTML(content: string): string {
    if (typeof window === 'undefined') {
        return sanitizeText(content);
    }

    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
        ALLOWED_ATTR: [],
    });
}

/**
 * Truncate and sanitize text for preview
 */
export function sanitizePreview(content: string, maxLength: number = 200): string {
    const sanitized = sanitizeText(content);
    if (sanitized.length <= maxLength) return sanitized;
    return sanitized.substring(0, maxLength) + '...';
}
