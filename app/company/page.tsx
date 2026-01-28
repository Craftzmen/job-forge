'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
    Briefcase,
    FileText,
    ArrowRight,
    TrendingUp,
    Clock,
    Building2,
    Plus,
    Loader2
} from 'lucide-react';
import { jobApi, applicationApi } from '@/lib/api';

interface CompanyStats {
    active_jobs: number;
    total_applications: number;
    weekly_applications: number;
}

interface RecentApplication {
    id: number;
    job_title: string;
    username: string;
    user_name: string;
    created_at: string;
}

export default function CompanyDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<CompanyStats>({
        active_jobs: 0,
        total_applications: 0,
        weekly_applications: 0,
    });
    const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const companyStats = [
        { label: 'Active Jobs', value: stats.active_jobs.toString(), icon: Briefcase, color: 'text-primary' },
        { label: 'Total Applications', value: stats.total_applications.toString(), icon: FileText, color: 'text-emerald-600' },
        { label: 'This Week', value: stats.weekly_applications.toString(), icon: TrendingUp, color: 'text-amber-600' },
    ];

    const quickActions = [
        { label: 'Post New Job', href: '/company/jobs/new', icon: Plus },
        { label: 'View Jobs', href: '/company/jobs', icon: Briefcase },
        { label: 'Applications', href: '/company/applications', icon: FileText },
    ];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsResponse, recentResponse] = await Promise.all([
                    jobApi.getCompanyStats(),
                    applicationApi.getRecent()
                ]);
                setStats(statsResponse);
                setRecentApplications(recentResponse);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'company') {
            fetchDashboardData();
        }
    }, [user]);

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">Company Dashboard</h1>
                            <Button asChild size="sm">
                                <Link href="/company/jobs/new" className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Post Job
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold">
                            Welcome back, {user?.name || user?.username}
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            Manage your job postings and review applications.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {companyStats.map((stat) => (
                            <Card key={stat.label} className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-3xl font-bold mt-1">
                                                {loading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    stat.value
                                                )}
                                            </p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {quickActions.map((action) => (
                                            <Button
                                                key={action.label}
                                                variant="outline"
                                                asChild
                                                className="h-auto py-4 flex flex-col items-center gap-2"
                                            >
                                                <Link href={action.href}>
                                                    <action.icon className="w-5 h-5" />
                                                    <span>{action.label}</span>
                                                </Link>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card className="shadow-none mt-6">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold">Recent Applications</h3>
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href="/company/applications" className="flex items-center gap-1">
                                                View All
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span className="ml-2">Loading applications...</span>
                                        </div>
                                    ) : recentApplications.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentApplications.slice(0, 5).map((application) => (
                                                <div key={application.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{application.user_name || application.username}</p>
                                                        <p className="text-xs text-muted-foreground">Applied to: {application.job_title}</p>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(application.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>No recent applications</p>
                                            <p className="text-sm">Applications will appear here when candidates apply.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Company Card */}
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                            <Building2 className="w-7 h-7 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{user?.name || user?.username}</h3>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/company/profile">
                                            View Profile
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Tips */}
                            <Card className="shadow-none bg-primary/5 border-primary/10">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold mb-3">Getting Started</h3>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            Create detailed job descriptions
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            List required skills clearly
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-primary">•</span>
                                            Review applications promptly
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
