'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resumeApi, Resume } from '@/lib/api';
import Link from 'next/link';
import {
    ArrowLeft,
    Printer,
    Download,
    Mail,
    Phone,
    MapPin,
    Globe,
    Briefcase,
    GraduationCap,
    CheckCircle2,
    Edit,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResumeViewPage() {
    const params = useParams();
    const router = useRouter();
    const resumeId = Number(params.id);

    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchResume() {
            try {
                setLoading(true);
                const data = await resumeApi.getById(resumeId);
                setResume(data);
                setError(null);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load resume brilliance');
            } finally {
                setLoading(false);
            }
        }

        if (resumeId) {
            fetchResume();
        }
    }, [resumeId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
                    <p className="text-muted-foreground font-medium text-lg">Curating professional assets...</p>
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !resume) {
        return (
            <ProtectedRoute>
                <div className="p-8 max-w-4xl mx-auto">
                    <Alert variant="destructive" className="rounded-3xl shadow-xl border-destructive/20 bg-destructive/5">
                        <AlertDescription className="text-destructive font-bold text-center py-4">
                            {error || 'Resume not found'}
                        </AlertDescription>
                        <div className="flex justify-center pb-4">
                            <Button variant="outline" asChild className="rounded-xl font-bold">
                                <Link href="/dashboard/resumes">Return to Portfolio</Link>
                            </Button>
                        </div>
                    </Alert>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20 pt-6">
                {/* Fixed Control Bar */}
                <div className="max-w-4xl mx-auto px-6 mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <Button variant="ghost" asChild className="rounded-xl hover:bg-white/80 dark:hover:bg-zinc-900 border border-transparent hover:border-border/50 transition-all font-semibold px-4">
                        <Link href="/dashboard/resumes" className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Resumes
                        </Link>
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handlePrint} className="rounded-xl border-border/50 bg-white dark:bg-zinc-900 font-semibold px-6 shadow-sm hover:shadow-md transition-all">
                            <Printer className="w-4 h-4 mr-2" />
                            Print / PDF
                        </Button>
                        <Button asChild className="rounded-xl bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold px-8 transition-all">
                            <Link href={`/dashboard/resumes/${resume.id}`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Resume
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Resume Paper Layout */}
                <div className="max-w-4xl mx-auto px-6 print:px-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Card className="rounded-none border-0 shadow-lg print:shadow-none overflow-hidden bg-white dark:bg-zinc-900">
                        <CardContent className="p-12 md:p-16 print:p-8 space-y-10">
                            {/* Resume Header */}
                            <div className="border-b-2 border-zinc-900 dark:border-zinc-100 pb-8 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                    <div className="space-y-1">
                                        <h1 className="text-4xl font-bold text-foreground">
                                            {resume.name || 'Your Name'}
                                        </h1>
                                        <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400">
                                            {resume.title}
                                        </p>
                                    </div>
                                    <div className="flex flex-col text-left md:text-right text-sm font-medium text-zinc-600 dark:text-zinc-400 space-y-1">
                                        {resume.email && (
                                            <div className="flex items-center md:justify-end gap-2">
                                                <span>{resume.email}</span>
                                                <Mail className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                        {resume.phone && (
                                            <div className="flex items-center md:justify-end gap-2">
                                                <span>{resume.phone}</span>
                                                <Phone className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                        {resume.location && (
                                            <div className="flex items-center md:justify-end gap-2">
                                                <span>{resume.location}</span>
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                        {resume.links && resume.links.map((link, idx) => (
                                            <div key={idx} className="flex items-center md:justify-end gap-2">
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-zinc-900 dark:text-zinc-100">
                                                    {link.label}
                                                </a>
                                                <Globe className="w-3.5 h-3.5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Section */}
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-1">Professional Summary</h2>
                                <p className="text-zinc-700 dark:text-zinc-300 text-[15px] leading-relaxed">
                                    {resume.summary}
                                </p>
                            </div>

                            {/* Experience Section */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-1">Work Experience</h2>
                                <div className="space-y-8">
                                    {resume.experience.map((exp: any, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{exp.position}</h3>
                                                <span className="text-sm font-semibold text-zinc-500 italic">
                                                    {exp.duration || '2022 - Present'}
                                                </span>
                                            </div>
                                            <div className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-200">
                                                {exp.company}
                                            </div>
                                            <p className="text-zinc-700 dark:text-zinc-300 text-[15px] leading-relaxed">
                                                {exp.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Education Section */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-1">Education</h2>
                                <div className="grid md:grid-cols-1 gap-6">
                                    {resume.education.map((edu: any, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{edu.degree}</h3>
                                                <span className="text-sm font-semibold text-zinc-500 italic">{edu.year || '2019'}</span>
                                            </div>
                                            <div className="text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
                                                {edu.institution}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Skills Section */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-1">Technical Skills</h2>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {resume.skills.map((skill: string, i: number) => (
                                        <div key={i} className="text-[15px] text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                            {skill}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
