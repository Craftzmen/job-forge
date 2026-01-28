'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { resumeApi, Resume } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus,
    FileText,
    Edit,
    Trash2,
    CheckCircle2,
    Clock,
    Eye,
    MapPin
} from 'lucide-react';

export default function ResumesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchResumes();
    }, []);

    async function fetchResumes() {
        try {
            setLoading(true);
            const data = await resumeApi.getAll();
            setResumes(data);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load resumes');
        } finally {
            setLoading(false);
        }
    }

    async function handleSetActive(resume: Resume) {
        try {
            setActionLoading(true);
            await resumeApi.setActive(resume.id);
            await fetchResumes();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to set active resume');
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDelete() {
        if (!resumeToDelete) return;

        try {
            setActionLoading(true);
            await resumeApi.delete(resumeToDelete.id);
            setDeleteDialogOpen(false);
            setResumeToDelete(null);
            await fetchResumes();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete resume');
        } finally {
            setActionLoading(false);
        }
    }

    function openDeleteDialog(resume: Resume) {
        setResumeToDelete(resume);
        setDeleteDialogOpen(true);
    }

    return (
        <ProtectedRoute role="user">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <h1 className="text-xl font-semibold">My Resumes</h1>
                            <Button asChild size="sm">
                                <Link href="/dashboard/resumes/new" className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create Resume
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

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : resumes.length === 0 ? (
                        <Card className="shadow-none border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No resumes found</h3>
                                <p className="text-muted-foreground text-center mb-6 max-w-md">
                                    Create your first professional profile to get started.
                                </p>
                                <Button asChild>
                                    <Link href="/dashboard/resumes/new" className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create Your First Resume
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
                            </p>
                            {resumes.map((resume) => (
                                <Card
                                    key={resume.id}
                                    className={`shadow-none hover:bg-muted/50 transition-colors ${resume.is_active ? 'border-primary bg-primary/5' : ''}`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold truncate">{resume.title}</h3>
                                                    {resume.is_active && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground shrink-0">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    {resume.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {resume.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {resume.summary && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{resume.summary}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-1 rounded bg-muted text-xs">
                                                        {resume.experience.length} Exp
                                                    </span>
                                                    <span className="px-2 py-1 rounded bg-muted text-xs">
                                                        {resume.education.length} Edu
                                                    </span>
                                                    <span className="px-2 py-1 rounded bg-muted text-xs">
                                                        {resume.skills.length} Skills
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {!resume.is_active && (
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => handleSetActive(resume)}
                                                        disabled={actionLoading}
                                                    >
                                                        Set Active
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/resumes/${resume.id}/view`} className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        View
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/resumes/${resume.id}`} className="flex items-center gap-1">
                                                        <Edit className="w-3 h-3" />
                                                        Edit
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openDeleteDialog(resume)}
                                                    disabled={actionLoading}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Resume</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete &quot;{resumeToDelete?.title}&quot;? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    );
}
