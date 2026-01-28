'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { applicationApi, Application, resumeApi, Resume } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft,
    Briefcase,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    UserCircle,
    Mail,
    ChevronRight,
    ExternalLink,
    Building2
} from 'lucide-react';

export default function AdminApplicationViewPage() {
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

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        reviewing: 'bg-blue-100 text-blue-700',
        accepted: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-rose-100 text-rose-700',
    };

    if (loading) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !application) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <Alert variant="destructive">
                            <AlertDescription>{error || 'Application not found'}</AlertDescription>
                        </Alert>
                        <Button variant="outline" asChild className="mt-4">
                            <Link href="/admin/applications">Back to Applications</Link>
                        </Button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <Button variant="ghost" asChild size="sm">
                                <Link href="/admin/applications" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Link>
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateStatus('rejected')}
                                    disabled={actionLoading || application.status === 'rejected'}
                                    className="text-rose-600"
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => updateStatus('accepted')}
                                    disabled={actionLoading || application.status === 'accepted'}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Accept
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Candidate Info */}
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                            <UserCircle className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${statusColors[application.status]}`}>
                                                    {application.status}
                                                </span>
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Applied {new Date(application.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-bold">{application.user_name}</h2>
                                            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-4 h-4" />
                                                    {application.username}@example.com
                                                </span>
                                                <Link
                                                    href={`/admin/users/${application.user}`}
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    View Profile
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Cover Letter */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Cover Letter</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 rounded-lg bg-muted/50 border text-muted-foreground whitespace-pre-wrap">
                                        {application.cover_letter || "No cover letter provided."}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resume */}
                            {resume && (
                                <Card className="shadow-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Resume: {resume.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary</h4>
                                            <p className="text-sm">{resume.summary}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 rounded-lg bg-muted/50 border">
                                                <p className="text-xs text-muted-foreground">Experience</p>
                                                <p className="text-xl font-bold">{resume.experience.length}</p>
                                            </div>
                                            <div className="p-3 rounded-lg bg-muted/50 border">
                                                <p className="text-xs text-muted-foreground">Skills</p>
                                                <p className="text-xl font-bold">{resume.skills.length}</p>
                                            </div>
                                        </div>
                                        <Button variant="outline" asChild className="w-full">
                                            <Link href={`/dashboard/resumes/${resume.id}/view`} className="flex items-center gap-2">
                                                View Full Resume
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status Actions */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Update Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {['pending', 'reviewing', 'accepted', 'rejected'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(s)}
                                            disabled={actionLoading || application.status === s}
                                            className={`w-full p-3 rounded-lg border text-left font-medium capitalize transition-colors flex items-center justify-between ${application.status === s
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'hover:bg-muted border-border'
                                                }`}
                                        >
                                            {s}
                                            {application.status === s && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Job Info */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="w-5 h-5" />
                                        Applied Role
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-lg">{application.job_title}</p>
                                        <p className="text-muted-foreground flex items-center gap-1">
                                            <Building2 className="w-4 h-4" />
                                            {application.company}
                                        </p>
                                    </div>
                                    <Button variant="secondary" asChild className="w-full">
                                        <Link href={`/admin/jobs/${application.job}/view`}>
                                            View Job Details
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
