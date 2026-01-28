'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { applicationApi, Application, ApplicationListResponse } from '@/lib/api';
import Link from 'next/link';
import {
    FileText,
    Briefcase,
    Building2,
    Clock,
    ChevronRight,
    ChevronLeft,
    Search
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

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [currentPage]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response: ApplicationListResponse = await applicationApi.getAll({ page: currentPage });
            setApplications(response.results);
            setTotalCount(response.count);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / 10);

    return (
        <ProtectedRoute role="user">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">My Applications</h1>
                            <Button asChild size="sm">
                                <Link href="/jobs" className="flex items-center gap-2">
                                    <Search className="w-4 h-4" />
                                    Browse Jobs
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Stats Cards */}
                    {!loading && applications.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {(['pending', 'reviewing', 'accepted', 'rejected'] as const).map((status) => {
                                const count = applications.filter(a => a.status === status).length;
                                return (
                                    <Card key={status} className="shadow-none text-center">
                                        <CardContent className="p-4">
                                            <p className="text-2xl font-bold">{count}</p>
                                            <p className={`text-sm font-medium ${statusColors[status].split(' ').slice(1).join(' ')}`}>
                                                {statusLabels[status]}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : applications.length === 0 ? (
                        /* Empty State */
                        <Card className="shadow-none text-center border-dashed">
                            <CardContent className="py-16">
                                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    You haven't applied to any jobs yet. Start exploring opportunities!
                                </p>
                                <Button asChild>
                                    <Link href="/jobs" className="flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Browse Jobs
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Applications List */
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {totalCount} application{totalCount !== 1 ? 's' : ''} total
                            </p>
                            {applications.map((application) => (
                                <Link key={application.id} href={`/dashboard/applications/${application.id}`}>
                                    <Card className="shadow-none hover:bg-muted/50 transition-colors cursor-pointer mb-4">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                        <Building2 className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-semibold">
                                                            {application.job_title}
                                                        </h3>
                                                        <p className="text-muted-foreground">{application.company}</p>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                Applied {new Date(application.created_at).toLocaleDateString(undefined, {
                                                                    month: 'short',
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

                                                <div className="flex items-center gap-4">
                                                    <span className={`px-3 py-1 rounded text-xs font-medium ${statusColors[application.status]}`}>
                                                        {statusLabels[application.status]}
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            </div>

                                            {/* Cover Letter Preview */}
                                            {application.cover_letter && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {application.cover_letter}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={!hasPrevious}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground px-4">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={!hasNext}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
