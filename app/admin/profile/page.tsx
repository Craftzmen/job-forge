'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    UserCircle,
    Mail,
    Shield,
    Settings,
    LogOut,
    Lock,
    Bell
} from 'lucide-react';

export default function AdminProfilePage() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">Admin Profile</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {/* Profile Header */}
                    <Card className="shadow-none">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                                    <UserCircle className="w-16 h-16 text-muted-foreground" />
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
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {user.email}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Shield className="w-4 h-4" />
                                            Root Authority
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-none">
                            <CardHeader>
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                                    <Lock className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <CardTitle>Security</CardTitle>
                                <CardDescription>Manage your authentication methods.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-between">
                                    Change Password
                                    <Settings className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between">
                                    Enable 2FA
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="shadow-none">
                            <CardHeader>
                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <CardTitle>Preferences</CardTitle>
                                <CardDescription>Configure your notification settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-between">
                                    Notifications
                                    <Settings className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between">
                                    Display Settings
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Logout Section */}
                    <Card className="shadow-none border-destructive/20">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="text-center md:text-left">
                                    <h3 className="font-semibold text-destructive">Sign Out</h3>
                                    <p className="text-sm text-muted-foreground">End your current session.</p>
                                </div>
                                <Button
                                    onClick={logout}
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
