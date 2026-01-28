'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Building2,
    Mail,
    Shield,
    Settings,
    LogOut,
    Lock,
    Bell
} from 'lucide-react';

export default function CompanyProfilePage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">Company Profile</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {/* Profile Header */}
                    <Card className="shadow-none">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                                    <Building2 className="w-12 h-12 text-muted-foreground" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                                        <span className="px-2 py-1 rounded text-xs font-medium uppercase bg-indigo-100 text-indigo-700">
                                            {user.role}
                                        </span>
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            Active
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold">{user.name || user.username}</h2>
                                    <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5" />
                                    Company Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">Username</span>
                                    <span className="text-sm font-medium">{user.username}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">Company Name</span>
                                    <span className="text-sm font-medium">{user.name || 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">Email</span>
                                    <span className="text-sm font-medium truncate max-w-[180px]">{user.email}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Account & Security
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">Role</span>
                                    <span className="px-2 py-1 rounded text-xs font-medium uppercase bg-primary/10 text-primary">
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <span className="text-sm text-muted-foreground">User ID</span>
                                    <span className="text-sm font-medium">#{user.id}</span>
                                </div>
                                <Button variant="outline" className="w-full">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Change Password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Settings */}
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Settings
                            </CardTitle>
                            <CardDescription>Manage your account preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start">
                                <Bell className="w-4 h-4 mr-3" />
                                Notification Preferences
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Building2 className="w-4 h-4 mr-3" />
                                Company Information
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
                                onClick={logout}
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Sign Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
