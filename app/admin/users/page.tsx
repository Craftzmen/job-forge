'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { userApi, UserAdmin as User } from '@/lib/api';
import Link from 'next/link';
import {
    Users,
    Search,
    Mail,
    Edit,
    Trash2,
    ChevronRight
} from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const response = await userApi.getAll();
            if (response && 'results' in response) {
                setUsers(response.results || []);
            } else if (Array.isArray(response)) {
                setUsers(response);
            } else {
                setUsers([]);
            }
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = (users || []).filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ProtectedRoute role="admin">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">User Management</h1>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or username..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
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
                            {filteredUsers.length} users found
                        </p>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <Card className="shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                                <p className="text-muted-foreground text-center">
                                    Try adjusting your search filters.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredUsers.map((u) => (
                                <Card key={u.id} className="shadow-none hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                                                {u.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${u.role === 'admin'
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div>
                                                <h3 className="font-semibold truncate">{u.name}</h3>
                                                <p className="text-sm text-muted-foreground">@{u.username}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="w-4 h-4" />
                                                <span className="truncate">{u.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-1">
                                                    View
                                                    <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </Button>
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
