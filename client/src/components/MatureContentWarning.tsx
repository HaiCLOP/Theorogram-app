'use client';

import { useState } from 'react';
import { hideTheory } from '@/lib/api';

interface MatureContentWarningProps {
    theoryId: string;
    onAccept: () => void;
    onHide?: () => void;
}

/**
 * Mature Content Warning Overlay
 * Shown before viewing mature-flagged theories
 */
export default function MatureContentWarning({ theoryId, onAccept, onHide }: MatureContentWarningProps) {
    const [hiding, setHiding] = useState(false);

    const handleHide = () => {
        setHiding(true);
        hideTheory(theoryId);
        onHide?.();
    };

    return (
        <div className="card p-8 text-center space-y-6 border-2 border-yellow-500/50">
            {/* Warning icon */}
            <div className="text-5xl">⚠️</div>

            {/* Title */}
            <h2 className="text-xl text-yellow-400 font-mono">
                MATURE CONTENT WARNING
            </h2>

            {/* Description */}
            <p className="text-text-secondary max-w-md mx-auto">
                This theory has been flagged as containing mature content that may not be suitable for all audiences.
            </p>

            {/* Age verification message */}
            <p className="text-sm text-text-tertiary">
                By clicking "View Content", you confirm that you are of appropriate age
                and consent to viewing potentially sensitive material.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                    onClick={onAccept}
                    className="btn border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                    VIEW CONTENT
                </button>

                <button
                    onClick={handleHide}
                    disabled={hiding}
                    className="btn text-text-tertiary hover:text-text-secondary"
                >
                    {hiding ? 'HIDING...' : 'HIDE FROM FEED'}
                </button>
            </div>

            {/* Note */}
            <p className="text-xs text-text-tertiary">
                "Hide from Feed" will remove this theory from your feed permanently.
                You can still access it from the author's profile.
            </p>
        </div>
    );
}
