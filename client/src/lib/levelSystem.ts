/**
 * Level System Utilities (Client-side)
 * Mirrors server-side calculations for UI display
 */

export interface LevelInfo {
    level: number;
    title: string;
    currentRep: number;
    repForNextLevel: number;
    progress: number;
}

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

export function getLevelInfo(reputation: number): LevelInfo {
    let level = 1;
    let title = LEVEL_CONFIG[0].title;
    let nextThreshold = LEVEL_CONFIG[1]?.minRep || Infinity;
    let currentThreshold = 0;

    for (let i = 0; i < LEVEL_CONFIG.length; i++) {
        if (reputation >= LEVEL_CONFIG[i].minRep) {
            level = i + 1;
            title = LEVEL_CONFIG[i].title;
            currentThreshold = LEVEL_CONFIG[i].minRep;
            nextThreshold = LEVEL_CONFIG[i + 1]?.minRep || currentThreshold + 1000;
        }
    }

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

export function formatReputation(rep: number): string {
    if (rep >= 1000) {
        return (rep / 1000).toFixed(1) + 'k';
    }
    return rep.toString();
}
