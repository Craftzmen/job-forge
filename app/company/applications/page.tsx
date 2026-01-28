'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applicationApi, Application } from '@/lib/api';
import Link from 'next/link';
import {
    FileText,
    User,
    Briefcase,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Search
} from 'lucide-react';

export default function CompanyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchApplications();
    }, []);

    async function fetchApplications() {
        try {
            setLoading(true);
            const response = await applicationApi.getAll();
            if (response && 'results' in response) {
                setApplications(response.results || []);
            } else if (Array.isArray(response)) {
                setApplications(response);
            } else {
                setApplications([]);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load applications');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    }

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        reviewing: 'bg-blue-100 text-blue-700',
        accepted: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-rose-100 text-rose-700',
    };

    const getStatusIcon = (status: string) => {
        if (status === 'accepted') return <CheckCircle2 className="w-3 h-3" />;
        if (status === 'rejected') return <XCircle className="w-3 h-3" />;
        return <Clock className="w-3 h-3" />;
    };

    const filteredApplications = applications.filter((app) => {
        const matchesSearch =
            app.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app as any).applicant_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">Applications</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by job title or applicant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Results Count */}
                    {!loading && (
                        <p className="text-sm text-muted-foreground mb-6">
                            {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
                        </p>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <Card className="shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                                <p className="text-muted-foreground text-center">
                                    {searchQuery || statusFilter !== 'all'
                                        ? 'Try adjusting your filters.'
                                        : 'Applications will appear here when candidates apply.'}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map((application) => (
                                <Card key={application.id} className="shadow-none hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    <User className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold truncate">
                                                        {(application as any).applicant_name || application.user_name || 'Anonymous'}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="w-4 h-4" />
                                                            {application.job_title || 'N/A'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date((application as any).applied_at || application.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {application.cover_letter && (
                                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                                            {application.cover_letter}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`px-2 py-1 rounded text-xs font-medium uppercase flex items-center gap-1 ${statusColors[application.status]}`}>
                                                    {getStatusIcon(application.status)}
                                                    {application.status}
                                                </span>
                                                <Button size="sm" asChild>
                                                    <Link href={`/company/applications/${application.id}`} className="flex items-center gap-1">
                                                        View
                                                        <ChevronRight className="w-3 h-3" />
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
        </ProtectedRoute>
    );
}
