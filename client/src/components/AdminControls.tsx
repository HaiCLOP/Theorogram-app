'use client';

import { useState } from 'react';
import { adminDeleteTheory, flagTheoryMature, unflagTheoryMature } from '@/lib/api';

interface AdminControlsProps {
    theoryId: string;
    isMature?: boolean;
    onDeleted?: () => void;
    onFlagChanged?: (isMature: boolean) => void;
}

/**
 * Admin Controls Panel
 * Only visible to admin users
 */
export default function AdminControls({ theoryId, isMature = false, onDeleted, onFlagChanged }: AdminControlsProps) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');

    const handleFlagMature = async () => {
        setLoading(true);
        setMessage(null);
        try {
            if (isMature) {
                await unflagTheoryMature(theoryId);
                setMessage('Mature flag removed');
                onFlagChanged?.(false);
            } else {
                await flagTheoryMature(theoryId, 'Admin flagged as mature content');
                setMessage('Theory flagged as mature');
                onFlagChanged?.(true);
            }
        } catch (error: any) {
            setMessage(error.message || 'Failed to update flag');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        setMessage(null);
        try {
            await adminDeleteTheory(theoryId, deleteReason || 'Removed by admin');
            setMessage('Theory deleted');
            onDeleted?.();
        } catch (error: any) {
            setMessage(error.message || 'Failed to delete theory');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="border border-red-500/30 bg-red-500/5 rounded p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 text-red-400 text-sm font-mono">
                <span>🛡️</span>
                <span>ADMIN CONTROLS</span>
            </div>

            {/* Message */}
            {message && (
                <p className="text-sm text-yellow-400">{message}</p>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm ? (
                <div className="space-y-3">
                    <p className="text-sm text-red-400">Are you sure you want to delete this theory?</p>
                    <input
                        type="text"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Reason for deletion..."
                        className="input w-full text-sm"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="btn text-red-400 border-red-500 hover:bg-red-500/10"
                        >
                            {loading ? 'DELETING...' : 'CONFIRM DELETE'}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="btn text-text-tertiary"
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {/* Flag as mature button */}
                    <button
                        onClick={handleFlagMature}
                        disabled={loading}
                        className={`btn text-sm ${isMature ? 'border-yellow-500 text-yellow-400' : 'text-text-secondary'}`}
                    >
                        {loading ? '...' : isMature ? '🔓 UNFLAG MATURE' : '🔞 FLAG MATURE'}
                    </button>

                    {/* Delete button */}
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={loading}
                        className="btn text-sm text-red-400 border-red-500 hover:bg-red-500/10"
                    >
                        🗑️ DELETE THEORY
                    </button>
                </div>
            )}
        </div>
    );
}
