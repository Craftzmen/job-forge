'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { userApi, UserAdmin as User, applicationApi, Application } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft,
    UserCircle,
    Mail,
    Shield,
    FileText,
    Send,
    ChevronRight,
    Building2,
    Calendar
} from 'lucide-react';

export default function AdminUserViewPage() {
    const params = useParams();
    const router = useRouter();
    const userId = Number(params.id);

    const [user, setUser] = useState<User | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [userData, appData] = await Promise.all([
                    userApi.getById(userId),
                    applicationApi.getAll(),
                ]);

                setUser(userData);
                const userApps = (appData as any).results
                    ? (appData as any).results.filter((a: any) => a.user === userId)
                    : [];
                setApplications(userApps);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load user details');
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            fetchData();
        }
    }, [userId]);

    if (loading) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !user) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <Alert variant="destructive">
                            <AlertDescription>{error || 'User not found'}</AlertDescription>
                        </Alert>
                        <Button variant="outline" asChild className="mt-4">
                            <Link href="/admin/users">Back to Users</Link>
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
                                <Link href="/admin/users" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Link>
                            </Button>
                            <span className={`px-3 py-1 rounded text-xs font-medium uppercase ${user.role === 'admin'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sidebar - User Info */}
                        <div className="space-y-6">
                            <Card className="shadow-none">
                                <CardContent className="p-6 text-center">
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                        <UserCircle className="w-12 h-12 text-muted-foreground" />
                                    </div>
                                    <h2 className="text-xl font-bold">{user.name}</h2>
                                    <p className="text-sm text-muted-foreground">@{user.username}</p>

                                    <div className="mt-4 pt-4 border-t space-y-3">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm truncate">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                            <Shield className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm capitalize">{user.role} Access</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-xs text-muted-foreground uppercase">Applications</p>
                                        <p className="text-2xl font-bold">{applications.length}</p>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-xs text-muted-foreground uppercase">Resumes</p>
                                        <p className="text-2xl font-bold">-</p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Applications */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Send className="w-5 h-5" />
                                        Recent Applications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {applications.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p>No applications submitted yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {applications.map((app) => (
                                                <Link
                                                    key={app.id}
                                                    href={`/admin/applications/${app.id}`}
                                                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold">{app.job_title}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Building2 className="w-3 h-3" />
                                                                {app.company}
                                                            </p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                                                                app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                                                    'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(app.created_at).toLocaleDateString()}
                                                        </span>
                                                        <ChevronRight className="w-3 h-3" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Resumes Placeholder */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Resumes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                        <p>Resume access for admin viewing is currently limited.</p>
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
