import Link from 'next/link';
import { getLevelInfo } from '@/lib/levelSystem';

interface ProfileBadgeProps {
    username: string;
    level: number;
    reputation?: number;
    banned_status?: boolean;
    size?: 'small' | 'large';
}

/**
 * Profile Badge - System-issued credential
 * Shows level and title (e.g., "LVL 4 // ORACLE")
 */
export default function ProfileBadge({
    username,
    level,
    reputation = 0,
    banned_status = false,
    size = 'small'
}: ProfileBadgeProps) {
    const levelInfo = getLevelInfo(reputation);
    const displayLevel = level || levelInfo.level;
    const displayTitle = levelInfo.title;

    const status = banned_status ? 'BANNED' : 'ACTIVE';
    const statusColor = banned_status ? 'text-red-400' : 'text-[#00ff00]';

    if (size === 'small') {
        return (
            <Link
                href={`/profile/${username}`}
                className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 group"
            >
                {/* Abstract identity placeholder with level indicator */}
                <div className="w-8 h-8 bg-[#0d1a0d] border border-[#2a4a2a] rounded flex items-center justify-center relative">
                    <span className="text-xs text-[#4ada4a] font-mono font-bold">
                        {displayLevel}
                    </span>
                    {/* Active indicator */}
                    <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${banned_status ? 'bg-red-500' : 'bg-[#00ff00]'}`} />
                </div>

                <div className="flex flex-col">
                    <span className="text-sm text-text-primary font-mono group-hover:text-[#4ada4a] transition-colors">{username}</span>
                    <span className="text-xs text-[#6a9a6a] font-mono">LVL {displayLevel}</span>
                </div>
            </Link>
        );
    }

    // Large size for profile page
    return (
        <div className="card p-6 flex items-center gap-4 bg-gradient-to-r from-[#0a0f0a] to-[#0d1a0d] border border-[#1a3a1a]">
            {/* Abstract identity placeholder - larger */}
            <div className="w-20 h-20 bg-[#0d1a0d] border border-[#2a4a2a] rounded flex items-center justify-center relative">
                <span className="text-3xl text-[#4ada4a] font-mono font-bold">
                    {displayLevel}
                </span>
                {/* Active indicator */}
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${banned_status ? 'bg-red-500' : 'bg-[#00ff00]'} border-2 border-[#0a0f0a]`} />
            </div>

            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-mono text-text-primary">{username}</h2>
                <div className="flex items-center gap-3 text-sm font-mono">
                    <span className="text-[#ffe066]">LVL {displayLevel} // {displayTitle}</span>
                    <span className="text-[#2a4a2a]">|</span>
                    <span className={statusColor}>{status}</span>
                </div>
            </div>
        </div>
    );
}
