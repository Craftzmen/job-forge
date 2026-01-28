'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { resumeApi, aiApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Link as LinkIcon,
    Briefcase,
    GraduationCap,
    Plus,
    Trash2,
    Save,
    ArrowLeft,
    CheckCircle2,
    Settings2,
    Globe,
    Sparkles,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// Form data type
interface ResumeFormData {
    title: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    links: {
        label: string;
        url: string;
    }[];
    summary: string;
    experience: {
        title: string;
        company: string;
        startDate: string;
        endDate: string;
        description: string;
    }[];
    education: {
        degree: string;
        institution: string;
        year: string;
        field: string;
    }[];
    skills: string;
    is_active: boolean;
}

// Zod schemas for validation
const experienceSchema = z.object({
    title: z.string().min(1, 'Job title is required'),
    company: z.string().min(1, 'Company is required'),
    startDate: z.string(),
    endDate: z.string(),
    description: z.string(),
});

const educationSchema = z.object({
    degree: z.string().min(1, 'Degree is required'),
    institution: z.string().min(1, 'Institution is required'),
    year: z.string(),
    field: z.string(),
});

const linkSchema = z.object({
    label: z.string().min(1, 'Label is required'),
    url: z.string().url('Must be a valid URL'),
});

const resumeSchema = z.object({
    title: z.string().min(1, 'Resume title is required'),
    name: z.string(),
    email: z.string().email('Invalid email address').or(z.literal('')),
    phone: z.string(),
    location: z.string(),
    links: z.array(linkSchema),
    summary: z.string(),
    experience: z.array(experienceSchema),
    education: z.array(educationSchema),
    skills: z.string(),
    is_active: z.boolean(),
});

export default function NewResumePage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState<string | null>(null);

    const form = useForm<ResumeFormData>({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            title: '',
            name: '',
            email: '',
            phone: '',
            location: '',
            links: [],
            summary: '',
            experience: [],
            education: [],
            skills: '',
            is_active: true, // Default to true for new resumes
        },
    });

    const {
        fields: linkFields,
        append: appendLink,
        remove: removeLink,
    } = useFieldArray({
        control: form.control,
        name: 'links',
    });

    const {
        fields: experienceFields,
        append: appendExperience,
        remove: removeExperience,
    } = useFieldArray({
        control: form.control,
        name: 'experience',
    });

    const {
        fields: educationFields,
        append: appendEducation,
        remove: removeEducation,
    } = useFieldArray({
        control: form.control,
        name: 'education',
    });

    const handleSummaryAssist = async () => {
        const title = form.getValues('title');
        if (!title) {
            toast.error('Please enter a job title first');
            return;
        }

        try {
            setAiLoading('summary');
            const response = await aiApi.summarizeResume({
                title,
                skills: form.getValues('skills').split(',').map(s => s.trim()).filter(Boolean),
                experience: form.getValues('experience')
            });
            form.setValue('summary', response.content);
            toast.success('Summary generated');
        } catch (err) {
            toast.error('Failed to generate summary');
        } finally {
            setAiLoading(null);
        }
    };

    const handleSkillsAssist = async () => {
        const title = form.getValues('title');
        if (!title) {
            toast.error('Please enter a job title first');
            return;
        }

        try {
            setAiLoading('skills');
            const currentSkills = form.getValues('skills');
            const response = await aiApi.suggestSkills({
                title,
                current_skills: currentSkills ? currentSkills.split(',').map(s => s.trim()) : []
            });

            const newSkills = response.content;
            const updatedSkills = currentSkills
                ? `${currentSkills}${currentSkills.endsWith(',') ? ' ' : ', '}${newSkills}`
                : newSkills;

            form.setValue('skills', updatedSkills);
            toast.success('Skills suggested');
        } catch (err) {
            toast.error('Failed to suggest skills');
        } finally {
            setAiLoading(null);
        }
    };

    const handleExperienceAssist = async (index: number) => {
        const title = form.getValues(`experience.${index}.title`);
        const company = form.getValues(`experience.${index}.company`);
        const context = form.getValues(`experience.${index}.description`);

        if (!title || !company) {
            toast.error('Please enter job title and company');
            return;
        }

        try {
            setAiLoading(`experience-${index}`);
            const response = await aiApi.assistJobDescription({
                title,
                company,
                context
            });
            form.setValue(`experience.${index}.description`, response.content);
            toast.success('Points generated');
        } catch (err) {
            toast.error('Failed to generate points');
        } finally {
            setAiLoading(null);
        }
    };

    async function onSubmit(values: ResumeFormData) {
        setLoading(true);
        setError(null);

        try {
            // Convert comma-separated skills string to array
            const skillsArray = values.skills
                ? values.skills.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
                : [];

            await resumeApi.create({
                title: values.title,
                name: values.name,
                email: values.email,
                phone: values.phone,
                location: values.location,
                links: values.links,
                summary: values.summary || '',
                experience: values.experience,
                education: values.education,
                skills: skillsArray,
                is_active: values.is_active,
            });

            toast.success('Resume created successfully');
            router.push('/dashboard/resumes');
        } catch (err: any) {
            setError(err.response?.data?.detail || err.response?.data?.title?.[0] || 'Failed to create resume');
            toast.error('Failed to create resume');
        } finally {
            setLoading(false);
        }
    }

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <Button variant="ghost" asChild className="mb-2 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground">
                            <Link href="/dashboard/resumes">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Resumes
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Create Professional Resume</h1>
                        <p className="text-muted-foreground">Highlight your expertise and find your next opportunity.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/resumes">Cancel</Link>
                        </Button>
                        <Button onClick={form.handleSubmit(onSubmit)} disabled={loading} className="px-6">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin mr-2" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Save Resume
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Main Form */}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive" className="rounded-xl shadow-sm">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Main Details */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Basic Info */}
                                <Card className="shadow-none border-border/60">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="w-5 h-5 text-primary" />
                                            Professional Profile
                                        </CardTitle>
                                        <CardDescription>Primary information for your resume header</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="title"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Resume Title *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Senior Full Stack Engineer" {...field} className="h-11" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                                <Input placeholder="John Doe" {...field} className="pl-10" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Professional Email</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                                <Input placeholder="john@example.com" {...field} className="pl-10" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                                <Input placeholder="+1 (555) 000-0000" {...field} className="pl-10" />
                                                            </div>
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
                                                            <div className="relative">
                                                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                                <Input placeholder="New York, NY" {...field} className="pl-10" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="summary"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel>Professional Summary</FormLabel>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
                                                            onClick={handleSummaryAssist}
                                                            disabled={aiLoading === 'summary'}
                                                        >
                                                            {aiLoading === 'summary' ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            )}
                                                            AI Suggest
                                                        </Button>
                                                    </div>
                                                    <FormControl>
                                                        <textarea
                                                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                                            placeholder="Describe your professional journey and key strengths..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Experience Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <Briefcase className="w-5 h-5 text-primary" />
                                            Work Experience
                                        </h2>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => appendExperience({ title: '', company: '', startDate: '', endDate: '', description: '' })}
                                            className="h-8"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Role
                                        </Button>
                                    </div>

                                    {experienceFields.length === 0 ? (
                                        <Card className="shadow-none border-dashed py-8 border-border/80 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => appendExperience({ title: '', company: '', startDate: '', endDate: '', description: '' })}>
                                            <CardContent className="opacity-60 py-0">
                                                <Briefcase className="w-12 h-12 mb-3 text-muted-foreground mx-auto" />
                                                <p className="font-medium">No experience added yet</p>
                                                <p className="text-sm text-muted-foreground">Click the button above or here to add your first work history item.</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-4">
                                            {experienceFields.map((field, index) => (
                                                <Card key={field.id} className="shadow-none border-border/60 group">
                                                    <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0">
                                                        <h4 className="font-semibold text-primary">Role #{index + 1}</h4>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeExperience(index)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pb-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <FormField
                                                                control={form.control}
                                                                name={`experience.${index}.title`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Job Title *</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., Software Engineer" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`experience.${index}.company`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Company *</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="e.g., Acme Corp" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`experience.${index}.startDate`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Start Date</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Jan 2020" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`experience.${index}.endDate`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">End Date</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Present" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                        <FormField
                                                            control={form.control}
                                                            name={`experience.${index}.description`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <div className="flex items-center justify-between">
                                                                        <FormLabel className="text-xs">Description</FormLabel>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 text-[10px] text-primary hover:text-primary hover:bg-primary/5 gap-1"
                                                                            onClick={() => handleExperienceAssist(index)}
                                                                            disabled={aiLoading === `experience-${index}`}
                                                                        >
                                                                            {aiLoading === `experience-${index}` ? (
                                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                            ) : (
                                                                                <Sparkles className="w-3 h-3" />
                                                                            )}
                                                                            AI Help
                                                                        </Button>
                                                                    </div>
                                                                    <FormControl>
                                                                        <textarea
                                                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                            placeholder="Key responsibilities and achievements..."
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Education Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-primary" />
                                            Education
                                        </h2>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => appendEducation({ degree: '', institution: '', year: '', field: '' })}
                                            className="h-8"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add School
                                        </Button>
                                    </div>

                                    {educationFields.length === 0 ? (
                                        <Card className="shadow-none border-dashed py-8 border-border/80 text-center flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => appendEducation({ degree: '', institution: '', year: '', field: '' })}>
                                            <CardContent className="opacity-60 py-0">
                                                <GraduationCap className="w-12 h-12 mb-3 text-muted-foreground mx-auto" />
                                                <p className="font-medium">No education entries yet</p>
                                                <p className="text-sm text-muted-foreground">Add your degrees and academic background here.</p>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {educationFields.map((field, index) => (
                                                <Card key={field.id} className="shadow-none border-border/60 group">
                                                    <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0">
                                                        <h4 className="font-semibold text-primary">Qualification #{index + 1}</h4>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeEducation(index)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 pb-6">
                                                        <FormField
                                                            control={form.control}
                                                            name={`education.${index}.degree`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Degree *</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="e.g., Bachelor of Science" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`education.${index}.institution`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs">Institution *</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="e.g., University of California" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <FormField
                                                                control={form.control}
                                                                name={`education.${index}.field`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Field</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Computer Science" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                            <FormField
                                                                control={form.control}
                                                                name={`education.${index}.year`}
                                                                render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel className="text-xs">Grad Year</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="2020" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column - Secondary Settings */}
                            <div className="space-y-8">
                                {/* Configuration */}
                                <Card className="shadow-none border-border/60">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Settings2 className="w-5 h-5 text-primary" />
                                            Settings
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">Active Resume</FormLabel>
                                                        <p className="text-xs text-muted-foreground">Use this for job matches</p>
                                                    </div>
                                                    <FormControl>
                                                        <input
                                                            type="checkbox"
                                                            checked={field.value}
                                                            onChange={field.onChange}
                                                            className="h-5 w-5 rounded border-input text-primary focus:ring-primary"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="skills"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel>Skills (Comma-separated)</FormLabel>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
                                                            onClick={handleSkillsAssist}
                                                            disabled={aiLoading === 'skills'}
                                                        >
                                                            {aiLoading === 'skills' ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            )}
                                                            AI Suggest
                                                        </Button>
                                                    </div>
                                                    <FormControl>
                                                        <textarea
                                                            placeholder="React, TypeScript, Python, Node.js..."
                                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <p className="text-[10px] text-muted-foreground">These skills are used to match you with top job opportunities.</p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Links */}
                                <Card className="shadow-none border-border/60">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Globe className="w-5 h-5 text-primary" />
                                            Links
                                        </CardTitle>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => appendLink({ label: '', url: '' })}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {linkFields.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-lg">No links added</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {linkFields.map((field, index) => (
                                                    <div key={field.id} className="relative p-4 rounded-lg border bg-muted/10 space-y-3 group/link">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeLink(index)}
                                                            className="absolute top-1 right-1 h-6 w-6 text-muted-foreground opacity-0 group-hover/link:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                        <FormField
                                                            control={form.control}
                                                            name={`links.${index}.label`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider opacity-50">Platform</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="e.g., Portfolio" {...field} className="h-8 text-xs h-9" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                        <FormField
                                                            control={form.control}
                                                            name={`links.${index}.url`}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-[10px] uppercase font-bold tracking-wider opacity-50">URL</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="https://..." {...field} className="h-8 text-xs h-9" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Helper Card */}
                                <Card className="shadow-none border-primary/20 bg-primary/5">
                                    <CardContent className="p-4 flex items-start gap-3">
                                        <div className="shrink-0 pt-0.5">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="text-xs space-y-1">
                                            <p className="font-bold text-primary">AI Ready</p>
                                            <p className="text-muted-foreground leading-relaxed">
                                                Our AI will scan your resume to find the best job matches. Keep your summary and skills updated for the highest accuracy.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Mobile Submit Button */}
                        <div className="lg:hidden flex flex-col gap-3 pt-4">
                            <Button type="submit" disabled={loading} className="w-full h-11">
                                {loading ? 'Creating Resume...' : 'Save Resume'}
                            </Button>
                            <Button variant="outline" asChild className="w-full h-11">
                                <Link href="/dashboard/resumes">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ProtectedRoute>
    );
}
