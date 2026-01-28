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
    Search,
    Building2
} from 'lucide-react';

export default function AdminApplicationsPage() {
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

    async function updateStatus(id: number, status: string) {
        try {
            await applicationApi.update(id, { status });
            fetchApplications();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update status');
        }
    }

    const statusColors: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500',
        reviewing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500',
        accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500',
        rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-500',
    };

    const filteredApplications = (applications || []).filter(app => {
        const matchesSearch = app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.username.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">Application Management</h1>
                            </div>
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
                                placeholder="Search by job title or candidate..."
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
                            {filteredApplications.length} applications found
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
                                    Try adjusting your search or check back later.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {filteredApplications.map((app) => (
                                <Card key={app.id} className="shadow-none hover:bg-muted/50 transition-colors">
                                    <CardContent className="px-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-bold">
                                                        {app.user_name.split(' ').map(n => n[0]).join('')}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold truncate">{app.user_name}</p>
                                                    <p className="text-sm text-muted-foreground">@{app.username}</p>
                                                </div>
                                            </div>

                                            <div className="hidden md:block min-w-0 flex-1">
                                                <p className="font-medium truncate">{app.job_title}</p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {app.company}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${statusColors[app.status]}`}>
                                                    {app.status}
                                                </span>
                                                <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(app.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStatus(app.id, 'accepted');
                                                    }}
                                                    disabled={app.status === 'accepted'}
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStatus(app.id, 'rejected');
                                                    }}
                                                    disabled={app.status === 'rejected'}
                                                    className="text-rose-600 hover:text-rose-700"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/admin/applications/${app.id}`}>
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
        </ProtectedRoute>
    );
}
