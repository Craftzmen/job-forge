'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { jobApi, Job } from '@/lib/api';
import Link from 'next/link';
import {
    Plus,
    Briefcase,
    Edit,
    Trash2,
    MapPin,
    Clock,
    Building2,
    ChevronRight
} from 'lucide-react';

export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    async function fetchJobs() {
        try {
            setLoading(true);
            const response = await jobApi.getAll();
            setJobs(response.results);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!jobToDelete) return;

        try {
            setActionLoading(true);
            await jobApi.delete(jobToDelete.id);
            setDeleteDialogOpen(false);
            setJobToDelete(null);
            await fetchJobs();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete job');
        } finally {
            setActionLoading(false);
        }
    }

    function openDeleteDialog(job: Job) {
        setJobToDelete(job);
        setDeleteDialogOpen(true);
    }

    const experienceLevelLabel = (level: string) => {
        const labels: Record<string, string> = {
            entry: 'Entry',
            mid: 'Mid',
            senior: 'Senior',
        };
        return labels[level] || level;
    };

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">Job Management</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button asChild>
                                    <Link href="/admin/jobs/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create New Job
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Results Header */}
                    {!loading && (
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-muted-foreground">
                                {jobs.length} jobs found
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : jobs.length === 0 ? (
                        /* Empty State */
                        <Card className="shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Start by creating your first job posting.
                                </p>
                                <Button asChild>
                                    <Link href="/admin/jobs/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create Your First Job
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Job Cards */
                        <div className="space-y-4">
                            {jobs.map((job) => (
                                <Card key={job.id} className="shadow-none hover:bg-muted/50 transition-colors">
                                    <CardContent className="px-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                        <Briefcase className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <Building2 className="w-4 h-4" />
                                                            <span className="font-medium">{job.company}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {job.location}
                                                    </span>
                                                    <span className="px-2 py-1 rounded bg-muted text-xs">
                                                        {experienceLevelLabel(job.experience_level)} Level
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>

                                                {/* Skills */}
                                                {job.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.skills.slice(0, 4).map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-1 rounded bg-muted text-xs"
                                                            >
                                                                {skill}
                                                            </span>
                                                        ))}
                                                        {job.skills.length > 4 && (
                                                            <span className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
                                                                +{job.skills.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/jobs/${job.id}`} className="flex items-center gap-1">
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(job)}
                                                    disabled={actionLoading}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/jobs/${job.id}`}>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Job</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;<span className="font-semibold text-foreground">{jobToDelete?.title}</span>&quot; at {jobToDelete?.company}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Delete Job
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    );
}
