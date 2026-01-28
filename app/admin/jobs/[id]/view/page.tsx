'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jobApi, Job } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft,
    Edit,
    MapPin,
    Briefcase,
    Building2,
    Clock,
    CheckCircle2,
    ChevronRight
} from 'lucide-react';

export default function AdminJobViewPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchJob() {
            try {
                setLoading(true);
                const data = await jobApi.getById(jobId);
                setJob(data);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load job details');
            } finally {
                setLoading(false);
            }
        }

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const experienceLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            entry: 'Entry Level',
            mid: 'Mid Level',
            senior: 'Senior Level',
        };
        return labels[level] || level;
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

    if (error || !job) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <Alert variant="destructive">
                            <AlertDescription>{error || 'Job not found'}</AlertDescription>
                        </Alert>
                        <Button variant="outline" asChild className="mt-4">
                            <Link href="/admin/jobs">Back to Jobs</Link>
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
                                <Link href="/admin/jobs" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Link>
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/jobs/${job.id}`}>
                                        View Live Posting
                                    </Link>
                                </Button>
                                <Button size="sm" asChild>
                                    <Link href={`/admin/jobs/${job.id}`} className="flex items-center gap-1">
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Header */}
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                                            {experienceLevelLabel(job.experience_level)}
                                        </span>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            Active
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
                                    <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                                        <span className="flex items-center gap-2">
                                            <Building2 className="w-5 h-5" />
                                            {job.company}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            {job.location}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Description */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle>Job Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-muted-foreground whitespace-pre-wrap">
                                        {job.description}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Requirements */}
                            {job.requirements && job.requirements.length > 0 && (
                                <Card className="shadow-none">
                                    <CardHeader>
                                        <CardTitle>Requirements</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {job.requirements.map((req, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                                    <span>{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Skills */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Required Skills</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {job.skills.map((skill, i) => (
                                            <span key={i} className="px-3 py-1 rounded-lg bg-muted border text-sm">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-sm text-muted-foreground">Date Posted</p>
                                        <p className="font-medium flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4" />
                                            {new Date(job.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                        </p>
                                    </div>
                                    <Button variant="ghost" asChild className="w-full">
                                        <Link href="/admin/applications" className="flex items-center justify-center gap-2">
                                            View Applications
                                            <ChevronRight className="w-4 h-4" />
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
