'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AdminStats {
    users: {
        total: number;
        active: number;
        banned: number;
        shadowbanned: number;
        active_24h: number;
        active_7d: number;
        new_24h: number;
        new_7d: number;
    };
    theories: {
        total: number;
        published: number;
        shadowbanned: number;
        blocked: number;
        mature: number;
        new_24h: number;
        new_7d: number;
    };
    comments: { total: number };
    votes: { total: number };
}

interface User {
    id: string;
    // email removed as not in DB
    username: string;
    role: string;
    level: number;
    reputation_score: number;
    banned_status: boolean;
    shadowbanned: boolean;
    suspended_until: string | null;
    post_restricted_until: string | null;
    created_at: string;
    last_active_at: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user, dbUser, getToken } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'actions'>('overview');
    const [actionModal, setActionModal] = useState<{ user: User; action: string } | null>(null);
    const [actionDuration, setActionDuration] = useState(24);
    const [actionReason, setActionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Check if user is admin
    useEffect(() => {
        if (!loading && dbUser?.role !== 'admin') {
            router.push('/');
        }
    }, [dbUser, loading, router]);

    useEffect(() => {
        if (dbUser?.role === 'admin') {
            loadStats();
            loadUsers();
        }
    }, [dbUser, filter, search]);

    const authFetch = async (endpoint: string, options: RequestInit = {}) => {
        const token = await getToken();
        return fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });
    };

    const loadStats = async () => {
        try {
            const response = await authFetch('/api/admin/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const loadUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ filter, search, limit: '100' });
            const response = await authFetch(`/api/admin/users?${params}`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async () => {
        if (!actionModal) return;
        setActionLoading(true);
        setMessage(null);

        try {
            const { user, action } = actionModal;
            let endpoint = '';
            let body: any = { reason: actionReason };

            switch (action) {
                case 'suspend':
                    endpoint = `/api/admin/users/${user.id}/suspend`;
                    body.duration_hours = actionDuration;
                    break;
                case 'unsuspend':
                    endpoint = `/api/admin/users/${user.id}/unsuspend`;
                    break;
                case 'shadowban':
                    endpoint = `/api/admin/users/${user.id}/shadowban`;
                    break;
                case 'unshadowban':
                    endpoint = `/api/admin/users/${user.id}/unshadowban`;
                    break;
                case 'ban':
                    endpoint = `/api/admin/users/${user.id}/ban`;
                    break;
                case 'ban-timed':
                    endpoint = `/api/admin/users/${user.id}/ban-timed`;
                    body.duration_hours = actionDuration;
                    break;
                case 'unban':
                    endpoint = `/api/admin/users/${user.id}/unban`;
                    break;
                case 'restrict-posting':
                    endpoint = `/api/admin/users/${user.id}/restrict-posting`;
                    body.duration_hours = actionDuration;
                    break;
                case 'unrestrict-posting':
                    endpoint = `/api/admin/users/${user.id}/unrestrict-posting`;
                    break;
            }

            const response = await authFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                loadUsers();
                setActionModal(null);
            } else {
                setMessage(data.error || 'Action failed');
            }
        } catch (error) {
            setMessage('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (dbUser?.role !== 'admin') {
        return (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🔒</div>
                <h1 className="text-2xl text-text-secondary">Admin Access Required</h1>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-mono">🛡️ ADMIN CONSOLE</h1>
                    <p className="text-sm text-text-tertiary mt-2">Moderation & Analytics Dashboard</p>
                </div>
                <button onClick={loadStats} className="btn">↻ REFRESH</button>
            </div>

            {/* Message */}
            {message && (
                <div className="p-3 border border-accent/50 bg-accent/10 text-accent text-sm rounded">
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                {['overview', 'users', 'actions'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-2 px-4 font-mono uppercase ${activeTab === tab
                            ? 'text-accent border-b-2 border-accent'
                            : 'text-text-tertiary hover:text-text-secondary'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* User Stats */}
                    <div className="card p-6 space-y-4">
                        <h3 className="text-text-secondary font-mono">👥 USERS</h3>
                        <div className="text-4xl text-accent">{stats.users.total}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-text-tertiary">Active:</span> {stats.users.active}</div>
                            <div><span className="text-text-tertiary">Banned:</span> <span className="text-red-400">{stats.users.banned}</span></div>
                            <div><span className="text-text-tertiary">24h:</span> <span className="text-green-400">+{stats.users.new_24h}</span></div>
                            <div><span className="text-text-tertiary">7d:</span> <span className="text-green-400">+{stats.users.new_7d}</span></div>
                        </div>
                    </div>

                    {/* Active Users */}
                    <div className="card p-6 space-y-4">
                        <h3 className="text-text-secondary font-mono">📊 ACTIVITY</h3>
                        <div className="text-4xl text-green-400">{stats.users.active_24h}</div>
                        <p className="text-xs text-text-tertiary">Active in last 24h</p>
                        <div className="text-sm">
                            <span className="text-text-tertiary">7 days:</span> {stats.users.active_7d}
                        </div>
                    </div>

                    {/* Theories */}
                    <div className="card p-6 space-y-4">
                        <h3 className="text-text-secondary font-mono">📜 THEORIES</h3>
                        <div className="text-4xl text-accent">{stats.theories.total}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-text-tertiary">Published:</span> {stats.theories.published}</div>
                            <div><span className="text-text-tertiary">Mature:</span> <span className="text-yellow-400">{stats.theories.mature}</span></div>
                            <div><span className="text-text-tertiary">Blocked:</span> <span className="text-red-400">{stats.theories.blocked}</span></div>
                            <div><span className="text-text-tertiary">24h:</span> <span className="text-green-400">+{stats.theories.new_24h}</span></div>
                        </div>
                    </div>

                    {/* Engagement */}
                    <div className="card p-6 space-y-4">
                        <h3 className="text-text-secondary font-mono">💬 ENGAGEMENT</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-text-tertiary">Comments:</span>
                                <span>{stats.comments.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-tertiary">Votes:</span>
                                <span>{stats.votes.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Moderation Overview */}
                    <div className="card p-6 space-y-4 col-span-full lg:col-span-2">
                        <h3 className="text-text-secondary font-mono">⚠️ MODERATION STATUS</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded">
                                <div className="text-2xl text-red-400">{stats.users.banned}</div>
                                <div className="text-xs text-text-tertiary mt-1">Banned</div>
                            </div>
                            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded">
                                <div className="text-2xl text-purple-400">{stats.users.shadowbanned}</div>
                                <div className="text-xs text-text-tertiary mt-1">Shadowbanned</div>
                            </div>
                            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
                                <div className="text-2xl text-yellow-400">{stats.theories.mature}</div>
                                <div className="text-xs text-text-tertiary mt-1">Mature Content</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <input
                            type="text"
                            placeholder="Search username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input w-64"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="input"
                        >
                            <option value="all">All Users</option>
                            <option value="banned">Banned</option>
                            <option value="shadowbanned">Shadowbanned</option>
                            <option value="suspended">Suspended</option>
                            <option value="admins">Admins</option>
                        </select>
                    </div>

                    {/* User Table */}
                    <div className="card overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border text-text-tertiary">
                                    <th className="text-left p-4">Username</th>
                                    <th className="text-left p-4">Level</th>
                                    <th className="text-left p-4">Status</th>
                                    <th className="text-left p-4">Last Active</th>
                                    <th className="text-left p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-border-subtle hover:bg-border-subtle/20">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={u.role === 'admin' ? 'text-accent' : ''}>{u.username}</span>
                                                {u.role === 'admin' && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">ADMIN</span>}
                                            </div>
                                        </td>
                                        <td className="p-4">LVL {u.level}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {u.banned_status && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">BANNED</span>}
                                                {u.shadowbanned && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">SHADOW</span>}
                                                {u.suspended_until && new Date(u.suspended_until) > new Date() &&
                                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">SUSPENDED</span>}
                                                {u.post_restricted_until && new Date(u.post_restricted_until) > new Date() &&
                                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">NO-POST</span>}
                                                {!u.banned_status && !u.shadowbanned &&
                                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">ACTIVE</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-text-tertiary">
                                            {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4">
                                            {u.role !== 'admin' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setActionModal({ user: u, action: u.banned_status ? 'unban' : 'ban' })}
                                                        className={`text-xs px-2 py-1 rounded ${u.banned_status ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                                                    >
                                                        {u.banned_status ? 'Unban' : 'Ban'}
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ user: u, action: u.shadowbanned ? 'unshadowban' : 'shadowban' })}
                                                        className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400"
                                                    >
                                                        {u.shadowbanned ? 'Unshadow' : 'Shadow'}
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ user: u, action: 'suspend' })}
                                                        className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400"
                                                    >
                                                        Suspend
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ user: u, action: u.post_restricted_until && new Date(u.post_restricted_until) > new Date() ? 'unrestrict-posting' : 'restrict-posting' })}
                                                        className={`text-xs px-2 py-1 rounded ${u.post_restricted_until && new Date(u.post_restricted_until) > new Date() ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}
                                                    >
                                                        {u.post_restricted_until && new Date(u.post_restricted_until) > new Date() ? 'Allow Post' : 'No Post'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Actions Tab - Quick Actions */}
            {activeTab === 'actions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="card p-6 space-y-4">
                        <h3 className="font-mono text-text-secondary">🔨 MODERATION TOOLS</h3>
                        <ul className="space-y-2 text-sm text-text-tertiary">
                            <li>• Suspend User (Timed)</li>
                            <li>• Shadowban User</li>
                            <li>• Ban User (Timed/Permanent)</li>
                            <li>• Restrict Posting (Timed)</li>
                            <li>• Flag Theory as Mature</li>
                            <li>• Delete Theory</li>
                        </ul>
                        <p className="text-xs text-text-tertiary pt-4 border-t border-border-subtle">
                            Use the Users tab to apply actions to specific users.
                        </p>
                    </div>
                </div>
            )}

            {/* Action Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="card p-6 max-w-md w-full space-y-4">
                        <h3 className="text-xl font-mono">
                            {actionModal.action.toUpperCase()} @{actionModal.user.username}
                        </h3>

                        {['suspend', 'ban-timed', 'restrict-posting'].includes(actionModal.action) && (
                            <div>
                                <label className="text-sm text-text-secondary">Duration (hours)</label>
                                <input
                                    type="number"
                                    value={actionDuration}
                                    onChange={(e) => setActionDuration(Number(e.target.value))}
                                    className="input w-full mt-1"
                                    min="1"
                                />
                                <div className="flex gap-2 mt-2">
                                    {[1, 24, 72, 168, 720].map(h => (
                                        <button
                                            key={h}
                                            onClick={() => setActionDuration(h)}
                                            className="btn text-xs"
                                        >
                                            {h < 24 ? `${h}h` : `${h / 24}d`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm text-text-secondary">Reason</label>
                            <textarea
                                value={actionReason}
                                onChange={(e) => setActionReason(e.target.value)}
                                className="input w-full mt-1"
                                rows={3}
                                placeholder="Reason for this action..."
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={executeAction}
                                disabled={actionLoading}
                                className="btn border-accent text-accent flex-1"
                            >
                                {actionLoading ? 'Processing...' : 'CONFIRM'}
                            </button>
                            <button
                                onClick={() => setActionModal(null)}
                                className="btn text-text-tertiary flex-1"
                            >
                                CANCEL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
