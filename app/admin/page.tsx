'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { jobApi, applicationApi, userApi } from '@/lib/api';
import {
    Briefcase,
    FileText,
    Users,
    ArrowRight,
    Clock,
    ShieldCheck,
    Plus,
    Settings
} from 'lucide-react';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalApplications: 0,
        totalUsers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [jobsRes, appsRes, usersRes] = await Promise.all([
                    jobApi.getAll(),
                    applicationApi.getAll(),
                    userApi.getAll()
                ]);
                setStats({
                    activeJobs: jobsRes.results?.length || 0,
                    totalApplications: appsRes.results?.length || 0,
                    totalUsers: Array.isArray(usersRes) ? usersRes.length : usersRes.results?.length || 0
                });
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const adminActions = [
        {
            title: 'Job Management',
            description: 'Create, edit, and monitor job postings.',
            href: '/admin/jobs',
            icon: Briefcase,
        },
        {
            title: 'Applications',
            description: 'Review and manage candidate applications.',
            href: '/admin/applications',
            icon: FileText,
        },
        {
            title: 'User Management',
            description: 'Manage system users and their roles.',
            href: '/admin/users',
            icon: Users,
        }
    ];

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/admin/jobs/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        New Job
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/admin/profile" className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">Admin Access</span>
                        </div>
                        <h2 className="text-2xl font-bold">Welcome back, {user?.name || user?.username}</h2>
                        <p className="text-muted-foreground mt-1">System-wide overview and management</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="shadow-none">
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loading ? '...' : stats.activeJobs}
                                        </p>
                                    </div>
                                    <Briefcase className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none">
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Applications</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loading ? '...' : stats.totalApplications}
                                        </p>
                                    </div>
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none">
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loading ? '...' : stats.totalUsers}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-2">
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {adminActions.map((action, index) => {
                                            const Icon = action.icon;
                                            return (
                                                <Link key={index} href={action.href} className="group">
                                                    <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors h-full">
                                                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
                                                            <Icon className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                        <h4 className="font-semibold mb-1">{action.title}</h4>
                                                        <p className="text-sm text-muted-foreground">{action.description}</p>
                                                        <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                                                            Open
                                                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <Card className="shadow-none">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                        <Clock className="w-4 h-4" />
                                        Recent Activity
                                    </h3>
                                    <div className="space-y-3">
                                        {[
                                            { user: 'System', action: 'Dashboard loaded', time: 'Just now' },
                                            { user: 'Admin', action: 'Session started', time: '1 min ago' },
                                        ].map((log, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                                    {log.user.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{log.action}</p>
                                                    <p className="text-xs text-muted-foreground">{log.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
