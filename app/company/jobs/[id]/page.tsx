'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { jobApi, Job, ExperienceLevel } from '@/lib/api';
import Link from 'next/link';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';

interface JobFormData {
    title: string;
    company: string;
    location: string;
    description: string;
    experience_level: ExperienceLevel;
    requirements: { value: string }[];
    skills: string;
}

const jobSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company name is required'),
    location: z.string().min(1, 'Location is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    experience_level: z.enum(['entry', 'mid', 'senior']),
    requirements: z.array(z.object({ value: z.string() })),
    skills: z.string(),
});

export default function CompanyEditJobPage() {
    const params = useParams();
    const router = useRouter();
    const jobId = Number(params.id);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const form = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: '',
            company: '',
            location: '',
            description: '',
            experience_level: 'mid',
            requirements: [],
            skills: '',
        },
    });

    const {
        fields: requirementFields,
        append: appendRequirement,
        remove: removeRequirement,
    } = useFieldArray({
        control: form.control,
        name: 'requirements',
    });

    useEffect(() => {
        async function fetchJob() {
            try {
                setFetching(true);
                const job = await jobApi.getById(jobId);

                form.reset({
                    title: job.title,
                    company: job.company,
                    location: job.location,
                    description: job.description,
                    experience_level: job.experience_level,
                    requirements: job.requirements.map((r) => ({ value: r })),
                    skills: job.skills.join(', '),
                });
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load job');
            } finally {
                setFetching(false);
            }
        }

        if (jobId) {
            fetchJob();
        }
    }, [jobId, form]);

    async function onSubmit(values: JobFormData) {
        setLoading(true);
        setError(null);

        try {
            const jobData = {
                title: values.title,
                company: values.company,
                location: values.location,
                description: values.description,
                experience_level: values.experience_level,
                requirements: values.requirements.map((r) => r.value).filter((v) => v.trim() !== ''),
                required_skills: values.skills.split(',').map((s) => s.trim()).filter((s) => s !== ''),
            };

            await jobApi.update(jobId, jobData);
            router.push('/company/jobs');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update job');
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <ProtectedRoute role="company">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute role="company">
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-4 h-16">
                            <Button asChild variant="ghost" size="icon">
                                <Link href="/company/jobs">
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                            </Button>
                            <h1 className="text-xl font-semibold">Edit Job</h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                            <CardDescription>Update the information about this job position.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Senior Software Engineer" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="company"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., TechCorp Inc." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="experience_level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Experience Level</FormLabel>
                                                <FormControl>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        {...field}
                                                    >
                                                        <option value="entry">Entry Level</option>
                                                        <option value="mid">Mid Level</option>
                                                        <option value="senior">Senior Level</option>
                                                    </select>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Description</FormLabel>
                                                <FormControl>
                                                    <textarea
                                                        placeholder="Describe the role..."
                                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Requirements</FormLabel>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => appendRequirement({ value: '' })}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Requirement
                                            </Button>
                                        </div>
                                        {requirementFields.map((field, index) => (
                                            <div key={field.id} className="flex gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`requirements.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input placeholder="e.g., 5+ years of experience" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {requirementFields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeRequirement(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="skills"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Required Skills (comma-separated)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., JavaScript, React, Node.js" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end gap-4 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => router.push('/company/jobs')}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
