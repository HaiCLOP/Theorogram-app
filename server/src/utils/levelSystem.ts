/**
 * Level System Utilities
 * Calculates user level from reputation points
 */

import { supabase } from '../config/supabase';

export interface LevelInfo {
    level: number;
    title: string;
    currentRep: number;
    repForNextLevel: number;
    progress: number; // 0-100 percentage
}

// ... existing code ...

/**
 * Update user reputation and level
 */
export async function updateReputation(userId: string, amount: number): Promise<void> {
    try {
        if (amount === 0) return;

        // Fetch current rep
        const { data: user, error } = await supabase
            .from('users')
            .select('reputation_score')
            .eq('id', userId)
            .single();

        if (error || !user) {
            console.error('Error fetching user for rep update:', error);
            return;
        }

        const currentRep = user.reputation_score || 0;
        const newRep = currentRep + amount;
        const levelInfo = getLevelInfo(newRep);

        // Update rep and level
        const { error: updateError } = await supabase
            .from('users')
            .update({
                reputation_score: newRep,
                level: levelInfo.level
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating reputation:', updateError);
        }
    } catch (e) {
        console.error('Update reputation exception:', e);
    }
}

// Level titles based on reputation thresholds
const LEVEL_CONFIG = [
    { minRep: 0, title: 'INITIATE' },
    { minRep: 100, title: 'THEORIST' },
    { minRep: 400, title: 'SCHOLAR' },
    { minRep: 900, title: 'ORACLE' },
    { minRep: 1600, title: 'SAGE' },
    { minRep: 2500, title: 'ARCHITECT' },
    { minRep: 4000, title: 'LUMINARY' },
    { minRep: 6000, title: 'SOVEREIGN' },
];

// Reputation points for actions
export const REP_ACTIONS = {
    CREATE_THEORY: 50,
    RECEIVE_UPVOTE: 10,
    RECEIVE_DOWNVOTE: -5,
    RECEIVE_FOR_STANCE: 15,
    RECEIVE_AGAINST_STANCE: 5,
    TAKE_STANCE: 5,
    POST_COMMENT: 3,
};

/**
 * Calculate level information from reputation score
 */
export function getLevelInfo(reputation: number): LevelInfo {
    let level = 1;
    let title = LEVEL_CONFIG[0].title;
    let nextThreshold = LEVEL_CONFIG[1]?.minRep || Infinity;
    let currentThreshold = 0;

    // Find current level
    for (let i = 0; i < LEVEL_CONFIG.length; i++) {
        if (reputation >= LEVEL_CONFIG[i].minRep) {
            level = i + 1;
            title = LEVEL_CONFIG[i].title;
            currentThreshold = LEVEL_CONFIG[i].minRep;
            nextThreshold = LEVEL_CONFIG[i + 1]?.minRep || currentThreshold + 1000;
        }
    }

    // Calculate progress to next level
    const repInCurrentLevel = reputation - currentThreshold;
    const repNeededForNext = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.floor((repInCurrentLevel / repNeededForNext) * 100));

    return {
        level,
        title,
        currentRep: reputation,
        repForNextLevel: nextThreshold,
        progress,
    };
}

/**
 * Format reputation for display (e.g., 12.4k)
 */
export function formatReputation(rep: number): string {
    if (rep >= 1000) {
        return (rep / 1000).toFixed(1) + 'k';
    }
    return rep.toString();
}
