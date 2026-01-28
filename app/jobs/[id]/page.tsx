'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { jobApi, applicationApi, aiApi, Job } from '@/lib/api';
import { ApplyModal } from '@/components/ApplyModal';
import Link from 'next/link';
import {
    ArrowLeft,
    MapPin,
    Building2,
    Briefcase,
    Clock,
    User,
    CheckCircle2,
    Sparkles,
    Send,
    Check
} from 'lucide-react';

export default function JobDetailPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationId, setApplicationId] = useState<number | null>(null);
    const [matchScore, setMatchScore] = useState<number | null>(null);
    const [loadingMatchScore, setLoadingMatchScore] = useState(false);

    useEffect(() => {
        async function fetchJob() {
            try {
                setLoading(true);
                const data = await jobApi.getById(jobId);
                setJob(data);
                setError(null);

                // Check if user has already applied
                const appliedStatus = await applicationApi.checkApplied([jobId]);
                if (appliedStatus[String(jobId)]) {
                    setHasApplied(true);
                    setApplicationId(appliedStatus[String(jobId)]);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load job details');
            } finally {
                setLoading(false);
            }
        }

        async function fetchMatchScore() {
            try {
                setLoadingMatchScore(true);
                const result = await aiApi.getMatchScore({ job_id: jobId });
                setMatchScore(result.overall_score);
            } catch (err) {
                console.error('Failed to fetch match score:', err);
            } finally {
                setLoadingMatchScore(false);
            }
        }

        if (jobId) {
            fetchJob();
            fetchMatchScore();
        }
    }, [jobId]);

    const handleApplySuccess = () => {
        setHasApplied(true);
    };

    const experienceLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            entry: 'Entry Level',
            mid: 'Mid Level',
            senior: 'Senior Level',
        };
        return labels[level] || level;
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-6 hover:bg-muted/50 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Button>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                        <p className="text-muted-foreground font-medium">Loading job details...</p>
                    </div>
                ) : job ? (
                    <div className="space-y-8">
                        {/* Header Card */}
                        <Card className="shadow-none">
                            <CardContent>
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                    <div className="flex items-start gap-5">
                                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Building2 className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
                                            <p className="text-xl text-muted-foreground font-medium">{job.company}</p>
                                            <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <MapPin className="w-4 h-4" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Briefcase className="w-4 h-4" />
                                                    {experienceLevelLabel(job.experience_level)}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    Posted {new Date(job.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                                    <User className="w-4 h-4" />
                                                    By {job.posted_by_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Match Score & Apply Button */}
                                    <div className="flex flex-col items-stretch gap-4 lg:w-48">
                                        <div className="flex flex-col items-center p-4 rounded-lg bg-primary/10 border">
                                            <Sparkles className="w-5 h-5 text-primary mb-1" />
                                            <span className="text-2xl font-bold text-primary">
                                                {matchScore !== null ? `${matchScore}%` : loadingMatchScore ? '...' : '--%'}
                                            </span>
                                            <span className="text-sm text-muted-foreground">Match Score</span>
                                            {loadingMatchScore && (
                                                <span className="text-xs text-muted-foreground mt-1">Calculating...</span>
                                            )}
                                        </div>
                                        {user?.role !== 'admin' && (
                                            <>
                                                {hasApplied ? (
                                                    <Button
                                                        asChild
                                                        size="lg"
                                                        variant="outline"
                                                        className="w-full"
                                                    >
                                                        <Link href={applicationId ? `/dashboard/applications/${applicationId}` : '/dashboard/applications'}>
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Already Applied
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="lg"
                                                        onClick={() => setApplyModalOpen(true)}
                                                        className="w-full"
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Apply Now
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Description */}
                                <Card className="shadow-none">
                                    <CardContent>
                                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-primary" />
                                            Job Description
                                        </h2>
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                {job.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Requirements */}
                                {job.requirements.length > 0 && (
                                    <Card className="shadow-none">
                                        <CardContent>
                                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                                Requirements
                                            </h2>
                                            <ul className="space-y-3">
                                                {job.requirements.map((req, idx) => (
                                                    <li key={idx} className="flex items-start gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                                                        <span className="text-muted-foreground">{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Skills */}
                                {job.skills.length > 0 && (
                                    <Card className="shadow-none">
                                        <CardContent>
                                            <h3 className="text-lg font-bold mb-4">Required Skills</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {job.skills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Job Info Card */}
                                <Card className="shadow-none">
                                    <CardContent>
                                        <h3 className="text-lg font-bold">Job Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                                                <span className="text-sm text-muted-foreground">Company</span>
                                                <span className="text-sm font-medium">{job.company}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                                                <span className="text-sm text-muted-foreground">Location</span>
                                                <span className="text-sm font-medium">{job.location}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-border/40">
                                                <span className="text-sm text-muted-foreground">Experience</span>
                                                <span className="text-sm font-medium">{experienceLevelLabel(job.experience_level)}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm text-muted-foreground">Posted</span>
                                                <span className="text-sm font-medium">
                                                    {new Date(job.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Apply CTA */}
                                {user?.role !== 'admin' && (
                                    <Card className={`shadow-none ${hasApplied ? 'bg-green-500/10 border border-green-500/20' : ''}`}>
                                        <CardContent>
                                            {hasApplied ? (
                                                <>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Check className="w-5 h-5 text-green-600" />
                                                        <h3 className="text-lg font-bold text-green-600">Application Submitted</h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        You have already applied to this position. Track your application status in your dashboard.
                                                    </p>
                                                    <Button asChild className="w-full" variant="outline">
                                                        <Link href="/dashboard/applications">
                                                            View My Applications
                                                        </Link>
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-bold mb-2">Ready to Apply?</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Submit your application and let the company know you're interested.
                                                    </p>
                                                    <Button
                                                        onClick={() => setApplyModalOpen(true)}
                                                        className="w-full"
                                                    >
                                                        <Send className="w-4 h-4 mr-2" />
                                                        Apply Now
                                                    </Button>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>

                        {/* Apply Modal */}
                        {job && (
                            <ApplyModal
                                open={applyModalOpen}
                                onOpenChange={setApplyModalOpen}
                                jobs={[job]}
                                onSuccess={handleApplySuccess}
                            />
                        )}
                    </div>
                ) : (
                    <Card className="shadow-none text-center">
                        <CardContent>
                            <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="w-10 h-10 text-primary/40" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Job not found</h3>
                            <p className="text-muted-foreground mb-6">This job posting may have been removed or doesn't exist.</p>
                            <Button asChild variant="outline">
                                <Link href="/jobs">Browse All Jobs</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}
