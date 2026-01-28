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

export default function EditJobPage() {
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
            const requirementsArray = values.requirements
                .map((r) => r.value.trim())
                .filter((r) => r.length > 0);

            const skillsArray = values.skills
                ? values.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
                : [];

            await jobApi.update(jobId, {
                title: values.title,
                company: values.company,
                location: values.location,
                description: values.description,
                experience_level: values.experience_level,
                requirements: requirementsArray,
                skills: skillsArray,
            });

            router.push('/admin/jobs');
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.title?.[0] || 'Failed to update job');
        } finally {
            setLoading(false);
        }
    }

    if (fetching) {
        return (
            <ProtectedRoute role="admin">
                <div className="min-h-screen bg-background">
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
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
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-16">
                            <Button variant="ghost" asChild size="sm">
                                <Link href="/admin/jobs" className="flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">Edit Job</h1>
                        <p className="text-muted-foreground mt-1">Update the job listing details.</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Basic Info */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Basic Information</CardTitle>
                                    <CardDescription>Core details about the job position</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Title *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Senior Software Engineer" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="company"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Company *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Acme Inc." {...field} />
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
                                                    <FormLabel>Location *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Remote, New York" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="experience_level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Experience Level *</FormLabel>
                                                <FormControl>
                                                    <select
                                                        {...field}
                                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                                </CardContent>
                            </Card>

                            {/* Description */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Job Description</CardTitle>
                                    <CardDescription>Detailed description of the role and responsibilities</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <textarea
                                                        className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Requirements */}
                            <Card className="shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Requirements</CardTitle>
                                        <CardDescription>List the job requirements</CardDescription>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendRequirement({ value: '' })}
                                    >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Add
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {requirementFields.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">No requirements added yet</p>
                                    ) : (
                                        requirementFields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`requirements.${index}.value`}
                                                    render={({ field }) => (
                                                        <FormItem className="flex-1">
                                                            <FormControl>
                                                                <Input
                                                                    placeholder={`Requirement ${index + 1}`}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRequirement(index)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* Skills */}
                            <Card className="shadow-none">
                                <CardHeader>
                                    <CardTitle className="text-lg">Skills</CardTitle>
                                    <CardDescription>Required skills (comma-separated)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <FormField
                                        control={form.control}
                                        name="skills"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., Python, React, PostgreSQL, AWS"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/admin/jobs">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </ProtectedRoute>
    );
}
