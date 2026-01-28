'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { aiApi, JobMatch, resumeApi, applicationApi, Resume, Application } from '@/lib/api';
import {
    FileText,
    Plus,
    Users,
    ShieldCheck,
    Briefcase,
    Clock,
    Sparkles,
    MapPin,
    Loader2,
    Settings,
    TrendingUp,
    CheckCircle
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<JobMatch[]>([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);
    const [stats, setStats] = useState({
        totalResumes: 0,
        activeApplications: 0,
        averageMatchScore: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch recommendations
                setLoadingRecommendations(true);
                const recommendationsResult = await aiApi.getRecommendations({ limit: 50 }); // Get more for average calculation
                setRecommendations(recommendationsResult.recommendations.slice(0, 5)); // Keep only 5 for display

                // Calculate average match score
                const scores = recommendationsResult.recommendations.map(r => r.match_score).filter(score => score !== null);
                const averageMatchScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

                // Fetch resumes
                const resumes = await resumeApi.getAll();

                // Fetch applications
                const applicationsResponse = await applicationApi.getAll();
                const activeApplications = applicationsResponse.results.filter(app =>
                    app.status === 'pending' || app.status === 'reviewing' || app.status === 'accepted'
                );

                // Update stats
                setStats({
                    totalResumes: resumes.length,
                    activeApplications: activeApplications.length,
                    averageMatchScore
                });
                setLoadingStats(false);

                // Create recent activity
                const activities: any[] = [];

                // Add recent resume activities
                resumes
                    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                    .slice(0, 3)
                    .forEach(resume => {
                        activities.push({
                            id: `resume-${resume.id}`,
                            type: 'resume',
                            title: `Updated "${resume.title}" resume`,
                            timestamp: resume.updated_at,
                            icon: FileText
                        });
                    });

                // Add recent application activities
                activeApplications
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 3)
                    .forEach(app => {
                        activities.push({
                            id: `application-${app.id}`,
                            type: 'application',
                            title: `Applied to "${app.job_title}" at ${app.company}`,
                            timestamp: app.created_at,
                            icon: Briefcase
                        });
                    });

                // Sort all activities by timestamp and take top 5
                activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setRecentActivity(activities.slice(0, 5));
                setLoadingActivity(false);

            } catch (error) {
                console.error('Failed to load dashboard data:', error);
                setLoadingStats(false);
                setLoadingActivity(false);
            } finally {
                setLoadingRecommendations(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getTimeAgo = (dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <ProtectedRoute role="user">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">Dashboard</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/dashboard/resumes/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        New Resume
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href="/dashboard/profile" className="flex items-center gap-2">
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
                        <h2 className="text-2xl font-bold">Welcome back, {user?.name || user?.username}</h2>
                        <p className="text-muted-foreground mt-1">Track your job search progress</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className='shadow-none' >
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Resumes</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loadingStats ? '...' : stats.totalResumes}
                                        </p>
                                    </div>
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='shadow-none' >
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Active Applications</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loadingStats ? '...' : stats.activeApplications}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className='shadow-none' >
                            <CardContent className="px-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Match Score</p>
                                        <p className="text-3xl font-bold mt-1">
                                            {loadingStats ? '...' : `${stats.averageMatchScore}%`}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Activity & Actions */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Quick Actions */}
                            <Card className='shadow-none' >
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                                            <Link href="/dashboard/resumes">
                                                <FileText className="w-5 h-5" />
                                                <span className="text-xs">My Resumes</span>
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                                            <Link href="/dashboard/recommendations">
                                                <Sparkles className="w-5 h-5" />
                                                <span className="text-xs">AI Matching</span>
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                                            <Link href="/dashboard/applications">
                                                <Briefcase className="w-5 h-5" />
                                                <span className="text-xs">Applications</span>
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                                            <Link href="/jobs">
                                                <MapPin className="w-5 h-5" />
                                                <span className="text-xs">Browse Jobs</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card className='shadow-none' >
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingActivity ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : recentActivity.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-muted-foreground">No recent activity</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentActivity.map((activity) => {
                                                const Icon = activity.icon;
                                                const timeAgo = getTimeAgo(activity.timestamp);
                                                return (
                                                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                                        <div className="flex-shrink-0">
                                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{activity.title}</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Recommendations & Profile */}
                        <div className="space-y-6">
                            {/* Job Recommendations */}
                            <Card className='shadow-none' >
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        Job Matches
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loadingRecommendations ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        </div>
                                    ) : recommendations.length === 0 ? (
                                        <div className="text-center py-8 space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Create a resume to get recommendations
                                            </p>
                                            <Button asChild size="sm">
                                                <Link href="/dashboard/resumes/new">Create Resume</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recommendations.slice(0, 4).map((job) => (
                                                <Link key={job.id} href={`/jobs/${job.id}`} className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                    <div className="space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-medium text-sm leading-tight">{job.title}</h4>
                                                            <span className="text-xs font-medium px-2 py-1 rounded bg-muted">
                                                                {Math.round(job.match_score)}%
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{job.company}</p>
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">{job.location}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                            <Button asChild variant="outline" size="sm" className="w-full">
                                                <Link href="/dashboard/recommendations">View All Matches</Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Profile Card */}
                            <Card className='shadow-none' >
                                <CardContent className="p-6">
                                    <div className="text-center space-y-4">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{user?.name}</h3>
                                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                                        </div>
                                        <Button asChild variant="outline" size="sm" className="w-full">
                                            <Link href="/dashboard/profile">Edit Profile</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Admin Access (if applicable) */}
                            {user?.role === 'admin' && (
                                <Card className='shadow-none' >
                                    <CardContent className="p-6">
                                        <div className="text-center space-y-4">
                                            <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground" />
                                            <div>
                                                <h3 className="font-medium">Admin Console</h3>
                                                <p className="text-sm text-muted-foreground">Manage system settings</p>
                                            </div>
                                            <Button asChild size="sm" className="w-full">
                                                <Link href="/admin">Access Panel</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
