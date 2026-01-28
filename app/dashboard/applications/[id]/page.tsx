'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { applicationApi, Application } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    ArrowLeft,
    Building2,
    Briefcase,
    Clock,
    FileText,
    CheckCircle2,
    XCircle,
    Loader2,
    Trash2,
    ExternalLink
} from 'lucide-react';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500',
    reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    reviewing: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected',
};

const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-5 h-5" />,
    reviewing: <Loader2 className="w-5 h-5" />,
    accepted: <CheckCircle2 className="w-5 h-5" />,
    rejected: <XCircle className="w-5 h-5" />,
};

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);

    const [application, setApplication] = useState<Application | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        async function fetchApplication() {
            try {
                setLoading(true);
                const data = await applicationApi.getById(applicationId);
                setApplication(data);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load application details');
            } finally {
                setLoading(false);
            }
        }

        if (applicationId) {
            fetchApplication();
        }
    }, [applicationId]);

    const handleWithdraw = async () => {
        if (!application) return;

        setWithdrawing(true);
        try {
            await applicationApi.delete(application.id);
            toast.success('Application withdrawn successfully');
            router.push('/dashboard/applications');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to withdraw application');
        } finally {
            setWithdrawing(false);
            setWithdrawDialogOpen(false);
        }
    };

    return (
        <ProtectedRoute role="user">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-4 h-16">
                            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="text-xl font-semibold">Application Details</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : application ? (
                        <div className="space-y-6">
                            {/* Header Card */}
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                <Building2 className="w-7 h-7 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">{application.job_title}</h2>
                                                <p className="text-lg text-muted-foreground">{application.company}</p>
                                                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        Applied {new Date(application.created_at).toLocaleDateString(undefined, {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    {application.resume_title && (
                                                        <span className="flex items-center gap-1.5">
                                                            <FileText className="w-4 h-4" />
                                                            {application.resume_title}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusColors[application.status]}`}>
                                            {statusIcons[application.status]}
                                            <span className="font-medium">{statusLabels[application.status]}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Main Content - Cover Letter */}
                                <div className="lg:col-span-2">
                                    <Card className="shadow-none">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                Cover Letter
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {application.cover_letter || 'No cover letter provided.'}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    {/* Application Info */}
                                    <Card className="shadow-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Application Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <span className="text-sm text-muted-foreground">Status</span>
                                                <span className={`text-sm font-medium ${statusColors[application.status].split(' ')[1]}`}>
                                                    {statusLabels[application.status]}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <span className="text-sm text-muted-foreground">Applied On</span>
                                                <span className="text-sm font-medium">
                                                    {new Date(application.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                                <span className="text-sm font-medium">
                                                    {new Date(application.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Actions */}
                                    <Card className="shadow-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button asChild variant="outline" className="w-full justify-start">
                                                <Link href={`/jobs/${application.job}`}>
                                                    <Briefcase className="w-4 h-4 mr-2" />
                                                    View Job Posting
                                                    <ExternalLink className="w-3 h-3 ml-auto" />
                                                </Link>
                                            </Button>

                                            {application.status === 'pending' && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => setWithdrawDialogOpen(true)}
                                                    className="w-full justify-start"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Withdraw Application
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Status Timeline */}
                                    <Card className="shadow-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Status Timeline</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">Application Submitted</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(application.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {application.status !== 'pending' && (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${application.status === 'reviewing' ? 'bg-blue-500' :
                                                                application.status === 'accepted' ? 'bg-emerald-500' :
                                                                    'bg-rose-500'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium">{statusLabels[application.status]}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(application.updated_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card className="shadow-none text-center">
                            <CardContent className="py-16">
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Application not found</h3>
                                <p className="text-muted-foreground mb-6">This application may have been withdrawn or doesn't exist.</p>
                                <Button asChild variant="outline">
                                    <Link href="/dashboard/applications">View All Applications</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Withdraw Dialog */}
                    <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Withdraw Application</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to withdraw your application for {application?.job_title} at {application?.company}? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setWithdrawDialogOpen(false)}
                                    disabled={withdrawing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleWithdraw}
                                    disabled={withdrawing}
                                >
                                    {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </ProtectedRoute>
    );
}
