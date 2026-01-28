'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { aiApi, JobMatch, ExperienceLevel } from '@/lib/api';
import { ApplyModal } from '@/components/ApplyModal';
import { toast } from 'sonner';
import {
    Sparkles,
    Briefcase,
    MapPin,
    Clock,
    Search,
    Target,
    Brain,
    CheckCircle2,
    RefreshCw,
    ArrowRight,
    TrendingUp,
    Zap
} from 'lucide-react';

export default function RecommendationsPage() {
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<JobMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [resumeId, setResumeId] = useState<number | null>(null);
    const [resumeTitle, setResumeTitle] = useState<string>('');
    const [totalJobs, setTotalJobs] = useState(0);
    const [matchedJobs, setMatchedJobs] = useState(0);

    // Filters
    const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
    const [location, setLocation] = useState('');
    const [minScore, setMinScore] = useState([0]);

    // Apply modal
    const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);
    const [applyModalOpen, setApplyModalOpen] = useState(false);

    const fetchRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { limit: 50 };
            if (experienceLevel) params.experience_level = experienceLevel;
            if (location) params.location = location;
            if (minScore[0] > 0) params.min_score = minScore[0];

            const result = await aiApi.getRecommendations(params);
            setRecommendations(result.recommendations);
            setResumeId(result.resume_id);
            setResumeTitle(result.resume_title);
            setTotalJobs(result.total_jobs);
            setMatchedJobs(result.matched_jobs);
        } catch (error: any) {
            if (error.response?.status === 400 && error.response?.data?.error?.includes('resume')) {
                toast.error('Please create a resume first to get job recommendations');
                router.push('/dashboard/resumes/new');
            } else {
                toast.error('Failed to load recommendations');
            }
        } finally {
            setLoading(false);
        }
    }, [experienceLevel, location, minScore, router]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const getMatchScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        if (score >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    };

    const handleApply = (job: JobMatch) => {
        setSelectedJob(job);
        setApplyModalOpen(true);
    };

    const clearFilters = () => {
        setExperienceLevel('');
        setLocation('');
        setMinScore([0]);
    };

    if (loading) {
        return (
            <ProtectedRoute role="user">
                <div className="p-6 md:p-8 max-w-6xl mx-auto">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                                <Brain className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            <p className="text-muted-foreground">
                                AI is analyzing your profile and finding the best matches...
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute role="user">
            <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-primary" />
                            AI Job Recommendations
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Based on your resume: <span className="font-medium text-foreground">{resumeTitle}</span>
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRecommendations}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalJobs}</p>
                                <p className="text-xs text-muted-foreground">Jobs Analyzed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{matchedJobs}</p>
                                <p className="text-xs text-muted-foreground">Matches Found</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {recommendations.length > 0
                                        ? Math.round(recommendations.reduce((a, b) => a + b.match_score, 0) / recommendations.length)
                                        : 0}%
                                </p>
                                <p className="text-xs text-muted-foreground">Avg Match</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="shadow-none">
                        <CardContent className="flex items-center gap-3 p-4">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Zap className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {recommendations.filter(r => r.match_score >= 80).length}
                                </p>
                                <p className="text-xs text-muted-foreground">Top Matches</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Card - Always Visible */}
                <Card className="shadow-none">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold flex items-center justify-between">
                            <span>Filters</span>
                            {(experienceLevel || location || minScore[0] > 0) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-muted-foreground hover:text-foreground h-auto py-1 px-2"
                                >
                                    Clear all
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="experience-level">Experience Level</Label>
                                <Select
                                    value={experienceLevel || "all"}
                                    onValueChange={(value) => setExperienceLevel(value === 'all' ? '' : value as ExperienceLevel | '')}
                                >
                                    <SelectTrigger id="experience-level">
                                        <SelectValue placeholder="All Levels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="entry">Entry Level</SelectItem>
                                        <SelectItem value="mid">Mid Level</SelectItem>
                                        <SelectItem value="senior">Senior Level</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Search by location..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Minimum Match Score: {minScore[0]}%</Label>
                                <div className="pt-2">
                                    <Slider
                                        value={minScore}
                                        onValueChange={setMinScore}
                                        max={100}
                                        step={5}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Job Recommendations */}
                {recommendations.length === 0 ? (
                    <Card className="shadow-none">
                        <CardContent className="text-center py-12">
                            <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No matching jobs found</h3>
                            <p className="text-muted-foreground mb-4">
                                Try adjusting your filters or update your resume to get better matches.
                            </p>
                            <Button onClick={() => router.push('/dashboard/resumes')}>
                                Update Resume
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Showing {recommendations.length} recommendations
                        </p>
                        {recommendations.map((job, index) => (
                            <Card
                                key={job.id}
                                className="shadow-none hover:bg-muted/50 transition-colors"
                            >
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-4">
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getMatchScoreBg(job.match_score)}`}>
                                                        {Math.round(job.match_score)}% Match
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                                </div>
                                                <h3 className="text-lg font-bold mb-1 truncate">{job.title}</h3>
                                                <p className="text-sm text-muted-foreground mb-2">{job.company}</p>

                                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {job.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {job.experience_level === 'entry' ? 'Entry Level' :
                                                            job.experience_level === 'mid' ? 'Mid Level' : 'Senior Level'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/jobs/${job.id}`)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApply(job)}
                                                >
                                                    Apply
                                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Skills Row */}
                                        {(job.matching_skills?.length > 0 || job.missing_skills?.length > 0) && (
                                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                                                {job.matching_skills?.slice(0, 4).map((skill, idx) => (
                                                    <span
                                                        key={`match-${idx}`}
                                                        className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                    >
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                                {job.missing_skills?.slice(0, 2).map((skill, idx) => (
                                                    <span
                                                        key={`miss-${idx}`}
                                                        className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Apply Modal */}
                {selectedJob && (
                    <ApplyModal
                        open={applyModalOpen}
                        onOpenChange={setApplyModalOpen}
                        jobs={[selectedJob]}
                        onSuccess={() => {
                            toast.success('Application submitted successfully!');
                            setApplyModalOpen(false);
                        }}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}
