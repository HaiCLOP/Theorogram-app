'use client';

/**
 * Loading skeleton for theory cards
 * Shows animated placeholder while content loads
 */
export function TheoryCardSkeleton() {
    return (
        <article className="card p-6 space-y-4 animate-pulse">
            {/* Author skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-24 h-4 bg-border rounded" />
                    <div className="w-12 h-4 bg-border rounded" />
                </div>
                <div className="w-16 h-3 bg-border rounded" />
            </div>

            {/* Title skeleton */}
            <div className="space-y-2">
                <div className="w-3/4 h-5 bg-border rounded" />
                <div className="w-full h-3 bg-border rounded" />
                <div className="w-5/6 h-3 bg-border rounded" />
            </div>

            {/* Stats skeleton */}
            <div className="flex gap-6 pt-2 border-t border-border-subtle">
                <div className="w-8 h-3 bg-border rounded" />
                <div className="w-8 h-3 bg-border rounded" />
                <div className="w-12 h-3 bg-border rounded" />
                <div className="w-16 h-3 bg-border rounded" />
            </div>
        </article>
    );
}

/**
 * Loading skeleton for profile pages
 */
export function ProfileSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Profile card skeleton */}
            <div className="card p-8 space-y-4">
                <div className="w-32 h-6 bg-border rounded" />
                <div className="w-24 h-4 bg-border rounded" />
                <div className="flex gap-8 pt-4">
                    <div className="w-20 h-8 bg-border rounded" />
                    <div className="w-20 h-8 bg-border rounded" />
                </div>
            </div>

            {/* Theories list skeleton */}
            <div className="space-y-4">
                <div className="w-48 h-5 bg-border rounded" />
                <TheoryCardSkeleton />
                <TheoryCardSkeleton />
            </div>
        </div>
    );
}

/**
 * Loading skeleton for theory detail page
 */
export function TheoryDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <article className="card p-8 space-y-6">
                {/* Title */}
                <div className="w-3/4 h-8 bg-border rounded" />

                {/* Author */}
                <div className="flex items-center gap-4 pt-2 border-t border-border-subtle">
                    <div className="w-24 h-4 bg-border rounded" />
                    <div className="w-16 h-4 bg-border rounded" />
                </div>

                {/* Body */}
                <div className="space-y-2">
                    <div className="w-full h-4 bg-border rounded" />
                    <div className="w-full h-4 bg-border rounded" />
                    <div className="w-5/6 h-4 bg-border rounded" />
                    <div className="w-full h-4 bg-border rounded" />
                    <div className="w-3/4 h-4 bg-border rounded" />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <div className="w-16 h-8 bg-border rounded" />
                    <div className="w-16 h-8 bg-border rounded" />
                </div>
            </article>
        </div>
    );
}
