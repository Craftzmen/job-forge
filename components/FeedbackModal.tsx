'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

interface FeedbackModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (feedback: string) => void;
    loading?: boolean;
}

export function FeedbackModal({ open, onOpenChange, onSubmit, loading }: FeedbackModalProps) {
    const [feedback, setFeedback] = useState('');

    React.useEffect(() => {
        if (open) {
            setFeedback('');
        }
    }, [open]);

    const handleSubmit = () => {
        if (feedback.trim()) {
            onSubmit(feedback);
            setFeedback('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2rem] glass border-white/20 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Refine Cover Letter
                    </DialogTitle>
                    <DialogDescription>
                        What would you like to change in the generated cover letter?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="e.g. Make it more enthusiastic, highlight my cloud experience more..."
                        className="w-full h-32 px-4 py-3 rounded-xl border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!feedback.trim() || loading}
                        className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                        {loading ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Regenerate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
