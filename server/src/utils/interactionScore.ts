/**
 * Calculate interaction score for a theory
 * Formula: upvotes + downvotes + stances + comments
 */
export function calculateInteractionScore(stats: {
    upvotes: number;
    downvotes: number;
    for_count: number;
    against_count: number;
    comment_count: number;
}): number {
    return (
        stats.upvotes +
        stats.downvotes +
        stats.for_count +
        stats.against_count +
        stats.comment_count
    );
}
