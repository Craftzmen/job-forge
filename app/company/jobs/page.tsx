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

export default function CompanyJobsPage() {
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
            entry: 'Entry Level',
            mid: 'Mid Level',
            senior: 'Senior Level',
        };
        return labels[level] || level;
    };

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">Job Management</h1>
                            <Button asChild size="sm">
                                <Link href="/company/jobs/new" className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create Job
                                </Link>
                            </Button>
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

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <Card className="shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No jobs posted yet</h3>
                                <p className="text-muted-foreground text-center mb-6">
                                    Create your first job posting to start receiving applications.
                                </p>
                                <Button asChild>
                                    <Link href="/company/jobs/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create New Job
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted
                            </p>
                            {jobs.map((job) => (
                                <Card key={job.id} className="shadow-none hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="w-4 h-4" />
                                                            {job.company}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {job.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {experienceLevelLabel(job.experience_level)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                                        {job.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/company/jobs/${job.id}`} className="flex items-center gap-1">
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(job)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Job Posting</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete &quot;{jobToDelete?.title}&quot;? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
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
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
