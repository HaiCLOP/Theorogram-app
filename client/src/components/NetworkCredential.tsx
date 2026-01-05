'use client';

import { getLevelInfo, formatReputation } from '@/lib/levelSystem';

interface NetworkCredentialProps {
    username: string;
    reputation: number;
    theoriesCount: number;
    joinedAt: string;
    banned_status?: boolean;
    recentActivity?: ActivityItem[];
}

export interface ActivityItem {
    type: string;
    label: string;
    detail?: string;
    points: string;
    created_at: string;
}

/**
 * Network Access Credential - Premium profile badge
 * System-issued, non-customizable identity verification
 */
export default function NetworkCredential({
    username,
    reputation,
    theoriesCount,
    joinedAt,
    banned_status = false,
    recentActivity = []
}: NetworkCredentialProps) {
    const levelInfo = getLevelInfo(reputation);
    const joinDate = new Date(joinedAt);
    const blockNumber = Math.floor((joinDate.getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="relative bg-gradient-to-br from-[#0a0f0a] to-[#0d1a0d] border border-[#1a3a1a] rounded-lg overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff0008] to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a3a1a]">
                <div className="flex items-center gap-3">
                    {/* Shield icon */}
                    <div className="w-10 h-10 rounded-full bg-[#1a2a1a] border border-[#2a4a2a] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#4a9a4a]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 1L3 4v5c0 4.5 3 8.6 7 9.9 4-1.3 7-5.4 7-9.9V4l-7-3zm0 10a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-mono text-[#6ada6a] tracking-wider">THEOROGRAM</h3>
                        <p className="text-xs text-[#4a7a4a]">NETWORK ACCESS CREDENTIAL</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-sm font-mono text-[#ffe066]">LVL {levelInfo.level} // {levelInfo.title}</div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${banned_status ? 'bg-red-500' : 'bg-[#00ff00]'}`} />
                        <span className={banned_status ? 'text-red-400' : 'text-[#00ff00]'}>{banned_status ? 'SUSPENDED' : 'CLEARANCE ACTIVE'}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 grid grid-cols-[180px_1fr] gap-6">
                {/* Left: Avatar & Name */}
                <div className="space-y-4">
                    {/* Abstract Avatar */}
                    <div className="w-40 h-40 bg-[#0d1a0d] border border-[#2a4a2a] rounded-lg flex items-center justify-center relative overflow-hidden">
                        {/* Grid pattern */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#2a4a2a 1px, transparent 1px), linear-gradient(90deg, #2a4a2a 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                        {/* User icon */}
                        <svg className="w-20 h-20 text-[#3a6a3a]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-mono text-white">{username}</h2>
                        <p className="text-sm text-[#4a7a4a]">@{username}</p>
                    </div>

                    <div className="flex justify-between text-xs font-mono border-t border-[#1a3a1a] pt-3">
                        <span className="text-[#4a7a4a]">JOINED:</span>
                        <span className="text-[#8ada8a]">BLOCK #{blockNumber}</span>
                    </div>
                </div>

                {/* Right: Stats */}
                <div className="space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Reputation */}
                        <div className="bg-[#0a150a] border border-[#1a3a1a] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#6a9a6a]">REPUTATION</span>
                                <svg className="w-4 h-4 text-[#4ada4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="text-2xl font-mono text-white">{formatReputation(reputation)}</div>
                            <div className="text-xs text-[#4ada4a]">+{Math.floor(reputation * 0.1)} (7d)</div>
                        </div>

                        {/* Theories */}
                        <div className="bg-[#0a150a] border border-[#1a3a1a] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#6a9a9a]">THEORIES</span>
                                <svg className="w-4 h-4 text-[#4adada]" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                </svg>
                            </div>
                            <div className="text-2xl font-mono text-[#4adada]">{theoriesCount}</div>
                            <div className="text-xs text-[#4a9a9a]">Published</div>
                        </div>

                        {/* Level Progress */}
                        <div className="bg-[#0a150a] border border-[#1a3a1a] rounded p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-[#9a9a6a]">PROGRESS</span>
                                <svg className="w-4 h-4 text-[#dada4a]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="text-2xl font-mono text-[#dada4a]">{levelInfo.progress}%</div>
                            <div className="text-xs text-[#9a9a4a]">To LVL {levelInfo.level + 1}</div>
                        </div>
                    </div>

                    {/* Level Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#4a7a4a]">LVL {levelInfo.level} → LVL {levelInfo.level + 1}</span>
                            <span className="text-[#8ada8a]">{levelInfo.currentRep} / {levelInfo.repForNextLevel} RP</span>
                        </div>
                        <div className="h-2 bg-[#0a150a] border border-[#1a3a1a] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#4ada4a] to-[#8ada8a] transition-all duration-500"
                                style={{ width: `${levelInfo.progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Badge */}
                    <div className="flex items-center justify-between bg-[#0a150a] border border-[#1a3a1a] rounded p-4 mt-4 mb-4">
                        <div className="flex items-center gap-3">
                            {/* Rank icon */}
                            <div className="w-12 h-12 bg-gradient-to-br from-[#3a6a3a] to-[#2a4a2a] rounded flex items-center justify-center">
                                <span className="text-xl font-bold text-[#dada4a]">{levelInfo.level}</span>
                            </div>
                            <div>
                                <div className="text-sm font-mono text-white">{levelInfo.title}</div>
                                <div className="text-xs text-[#4a7a4a]">Network Rank</div>
                            </div>
                        </div>

                        {/* Barcode pattern */}
                        <div className="flex items-end gap-[2px] h-8">
                            {[4, 8, 3, 6, 8, 2, 5, 7, 4, 6, 3, 8].map((h, i) => (
                                <div key={i} className="w-1 bg-[#4a7a4a]" style={{ height: `${h * 3}px` }} />
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    {recentActivity && recentActivity.length > 0 && (
                        <div className="bg-[#0a100a] border border-[#1a3a1a] rounded overflow-hidden">
                            <div className="px-4 py-2 bg-[#0d1a0d] border-b border-[#1a3a1a] flex justify-between items-center">
                                <span className="text-xs font-mono text-[#6a9a6a]">RECENT ACTIVITY</span>
                                <span className="text-[10px] font-mono text-[#4a7a4a]">LAST 24H</span>
                            </div>
                            <div className="divide-y divide-[#1a3a1a]">
                                {recentActivity.map((activity, i) => (
                                    <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-[#0f1f0f] transition-colors">
                                        <div className="flex items-center gap-3">
                                            {activity.type === 'theory' ? (
                                                <svg className="w-4 h-4 text-[#4ada4a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4 text-[#4adada]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-sm text-text-primary">{activity.label}</span>
                                                {activity.detail && (
                                                    <span className="text-xs text-[#4a7a4a] truncate max-w-[200px]">{activity.detail}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono text-[#4ada4a]">{activity.points}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom border glow */}
            <div className="h-1 bg-gradient-to-r from-transparent via-[#4ada4a] to-transparent opacity-50" />
        </div>
    );
}
