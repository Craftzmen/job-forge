'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    delay?: number;
    onComplete?: () => void;
    className?: string;
}

export function TypewriterText({ text, speed = 20, delay = 0, onComplete, className }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText('');
        setIsComplete(false);

        let timeoutId: NodeJS.Timeout;
        let index = 0;

        const type = () => {
            if (index < text.length) {
                setDisplayedText(text.substring(0, index + 1));
                index++;
                timeoutId = setTimeout(type, speed);
            } else {
                setIsComplete(true);
                onComplete?.();
            }
        };

        const initialTimeout = setTimeout(type, delay);

        return () => {
            clearTimeout(initialTimeout);
            clearTimeout(timeoutId);
        };
    }, [text, speed, delay, onComplete]);

    return (
        <div className={className}>
            {displayedText}
            {!isComplete && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle" />
            )}
        </div>
    );
}
