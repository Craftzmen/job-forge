'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { applicationApi, Application, resumeApi, Resume } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft,
    User,
    Briefcase,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    UserCircle,
    ExternalLink
} from 'lucide-react';

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500',
    reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500',
};

export default function CompanyApplicationViewPage() {
    const params = useParams();
    const router = useRouter();
    const applicationId = Number(params.id);

    const [application, setApplication] = useState<Application | null>(null);
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const appData = await applicationApi.getById(applicationId);
                setApplication(appData);

                if (appData.resume) {
                    try {
                        const resumeData = await resumeApi.getById(appData.resume);
                        setResume(resumeData);
                    } catch (err) {
                        console.error('Failed to load resume details', err);
                    }
                }

                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load application details');
            } finally {
                setLoading(false);
            }
        }

        if (applicationId) {
            fetchData();
        }
    }, [applicationId]);

    const updateStatus = async (status: string) => {
        try {
            setActionLoading(true);
            await applicationApi.update(applicationId, { status });
            const updatedApp = await applicationApi.getById(applicationId);
            setApplication(updatedApp);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update application status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute role="company">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !application) {
        return (
            <ProtectedRoute role="company">
                <div className="min-h-screen bg-background p-8">
                    <div className="max-w-4xl mx-auto">
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error || 'Application not found'}</AlertDescription>
                        </Alert>
                        <Button asChild variant="outline">
                            <Link href="/company/applications">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Applications
                            </Link>
                        </Button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-4">
                                <Button asChild variant="ghost" size="icon">
                                    <Link href="/company/applications">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Link>
                                </Button>
                                <h1 className="text-xl font-semibold">Application Details</h1>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-medium uppercase ${statusColors[application.status] || statusColors.pending}`}>
                                {application.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Applicant Info */}
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                            <UserCircle className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-semibold">
                                                {application.user_name || 'Anonymous Applicant'}
                                            </h2>
                                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                                <Briefcase className="w-4 h-4" />
                                                Applied for: <span className="font-medium text-foreground">{application.job_title || 'N/A'}</span>
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                                                <Clock className="w-4 h-4" />
                                                {new Date(application.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cover Letter */}
                            {application.cover_letter && (
                                <Card className="shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-primary" />
                                            Cover Letter
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {application.cover_letter}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Resume Preview */}
                            {resume && (
                                <Card className="shadow-none">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-primary" />
                                                Resume Details
                                            </CardTitle>
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={`/dashboard/resumes/${resume.id}`} target="_blank">
                                                    View Full Resume
                                                    <ExternalLink className="w-4 h-4 ml-2" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {resume.summary && (
                                            <div>
                                                <h4 className="font-medium mb-2">Summary</h4>
                                                <p className="text-muted-foreground">{resume.summary}</p>
                                            </div>
                                        )}
                                        {resume.skills && resume.skills.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mb-2">Skills</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {resume.skills.map((skill, index) => (
                                                        <span key={index} className="px-2 py-1 rounded bg-muted text-sm">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar Actions */}
                        <div className="space-y-6">
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {application.status !== 'accepted' && (
                                        <Button
                                            onClick={() => updateStatus('accepted')}
                                            disabled={actionLoading}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Accept Application
                                        </Button>
                                    )}
                                    {application.status !== 'rejected' && (
                                        <Button
                                            onClick={() => updateStatus('rejected')}
                                            disabled={actionLoading}
                                            variant="destructive"
                                            className="w-full"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Application
                                        </Button>
                                    )}
                                    {application.status !== 'pending' && (
                                        <Button
                                            onClick={() => updateStatus('pending')}
                                            disabled={actionLoading}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Mark as Pending
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {resume && (
                                <Card className="shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Resume Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm text-muted-foreground">Resume ID</span>
                                            <span className="text-sm font-medium">#{resume.id}</span>
                                        </div>
                                        {resume.name && (
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                                <span className="text-sm text-muted-foreground">Name</span>
                                                <span className="text-sm font-medium">{resume.name}</span>
                                            </div>
                                        )}
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={`/dashboard/resumes/${resume.id}`} target="_blank">
                                                <FileText className="w-4 h-4 mr-2" />
                                                View Full Resume
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
