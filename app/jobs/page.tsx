'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jobApi, applicationApi, aiApi, Job, JobListResponse, JobFilters, ExperienceLevel } from '@/lib/api';
import { ApplyModal } from '@/components/ApplyModal';
import Link from 'next/link';
import {
    Search,
    MapPin,
    Building2,
    Briefcase,
    ChevronRight,
    Sparkles,
    Clock,
    CheckSquare,
    Square,
    Send,
    X,
    Check
} from 'lucide-react';

const LOCATIONS = ['Remote', 'New York', 'San Francisco', 'London', 'Berlin', 'Singapore'];
const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
];

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [selectedExperience, setSelectedExperience] = useState<ExperienceLevel | ''>('');
    const [skillsFilter, setSkillsFilter] = useState('');

    // Multi-select for bulk apply
    const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [applyModalOpen, setApplyModalOpen] = useState(false);

    // Track applied jobs
    const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());

    // AI Match Scores
    const [matchScores, setMatchScores] = useState<Record<number, number | null>>({});
    const [loadingMatchScores, setLoadingMatchScores] = useState(false);

    const fetchJobs = useCallback(async () => {
        try {
            setLoading(true);
            const filters: JobFilters = {
                page: currentPage,
            };

            if (searchQuery) filters.search = searchQuery;
            if (selectedLocation) filters.location = selectedLocation;
            if (selectedExperience) filters.experience_level = selectedExperience;
            if (skillsFilter) filters.skills = skillsFilter;

            const response: JobListResponse = await jobApi.getAll(filters);
            setJobs(response.results);
            setTotalCount(response.count);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
            setError(null);

            // Check which jobs user has already applied to
            if (response.results.length > 0) {
                const jobIds = response.results.map(j => j.id);
                const appliedStatus = await applicationApi.checkApplied(jobIds);
                setAppliedJobIds(new Set(Object.keys(appliedStatus).map(Number)));

                // Fetch AI Match Scores
                fetchMatchScores(jobIds);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchQuery, selectedLocation, selectedExperience, skillsFilter]);

    const fetchMatchScores = async (jobIds: number[]) => {
        try {
            setLoadingMatchScores(true);
            const response = await aiApi.getBulkMatchScores({ job_ids: jobIds });
            const scores: Record<number, number | null> = {};
            response.scores.forEach(s => {
                scores[s.job_id] = s.overall_score;
            });
            setMatchScores(prev => ({ ...prev, ...scores }));
        } catch (err) {
            console.error('Failed to fetch match scores:', err);
        } finally {
            setLoadingMatchScores(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedLocation('');
        setSelectedExperience('');
        setSkillsFilter('');
        setCurrentPage(1);
    };

    const toggleJobSelection = (jobId: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newSelected = new Set(selectedJobIds);
        if (newSelected.has(jobId)) {
            newSelected.delete(jobId);
        } else {
            newSelected.add(jobId);
        }
        setSelectedJobIds(newSelected);
    };

    const selectAllUnapplied = () => {
        const unappliedIds = jobs.filter(j => !appliedJobIds.has(j.id)).map(j => j.id);
        setSelectedJobIds(new Set(unappliedIds));
    };

    const clearSelection = () => {
        setSelectedJobIds(new Set());
        setSelectionMode(false);
    };

    const handleBulkApplySuccess = () => {
        // Add newly applied jobs to the applied set
        setAppliedJobIds(prev => new Set([...prev, ...selectedJobIds]));
        clearSelection();
    };

    const selectedJobs = jobs.filter(j => selectedJobIds.has(j.id));

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                {/* Top Navigation */}
                <div className="border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-xl font-semibold">Browse Jobs</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                {/* Filters are always visible below */}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Search and Filters */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && fetchJobs()}
                                        placeholder="Search jobs..."
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button onClick={() => fetchJobs()}>Search</Button>
                        </div>

                        {/* Filters */}
                        <Card className="mt-4 shadow-none">
                            <CardContent className="px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                                        <Select
                                            value={selectedLocation || "all"}
                                            onValueChange={(value) => {
                                                setSelectedLocation(value === "all" ? "" : value);
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All Locations" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Locations</SelectItem>
                                                {LOCATIONS.map((loc) => (
                                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Experience Level</label>
                                        <Select
                                            value={selectedExperience || "all"}
                                            onValueChange={(value) => {
                                                setSelectedExperience(value === "all" ? "" : value as ExperienceLevel | '');
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All Levels" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Levels</SelectItem>
                                                {EXPERIENCE_LEVELS.map((level) => (
                                                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Skills</label>
                                        <Input
                                            value={skillsFilter}
                                            onChange={(e) => setSkillsFilter(e.target.value)}
                                            placeholder="e.g., React, Python"
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <Button onClick={() => fetchJobs()} size="sm">Apply Filters</Button>
                                    <Button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedLocation('');
                                            setSelectedExperience('');
                                            setSkillsFilter('');
                                            fetchJobs();
                                        }}
                                        variant="outline"
                                        size="sm"
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Results Header */}
                    {!loading && (
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-muted-foreground">
                                {totalCount} jobs found
                            </p>
                            <div className="flex items-center gap-2">
                                {selectionMode ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={selectAllUnapplied}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearSelection}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectionMode(true)}
                                    >
                                        <CheckSquare className="w-4 h-4 mr-1" />
                                        Multi-Apply
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary animate-spin rounded-full" />
                        </div>
                    ) : jobs.length === 0 ? (
                        /* Empty State */
                        <Card className="shadow-none">
                            <CardContent className="flex flex-col items-center justify-center py-20">
                                <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Try adjusting your search criteria or filters.
                                </p>
                                <Button onClick={() => {
                                    setSearchQuery('');
                                    setSelectedLocation('');
                                    setSelectedExperience('');
                                    setSkillsFilter('');
                                    fetchJobs();
                                }} variant="outline">
                                    Clear Filters
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        /* Job Cards */
                        <div className="space-y-4">
                            {jobs.map((job) => {
                                const isApplied = appliedJobIds.has(job.id);
                                const isSelected = selectedJobIds.has(job.id);

                                return (
                                    <div key={job.id} className="relative">
                                        {/* Selection Checkbox */}
                                        {selectionMode && !isApplied && (
                                            <button
                                                onClick={(e) => toggleJobSelection(job.id, e)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-1 rounded hover:bg-muted transition-colors"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-muted-foreground" />
                                                )}
                                            </button>
                                        )}

                                        <Link href={`/jobs/${job.id}`}>
                                            <Card className={`shadow-none border transition-colors cursor-pointer hover:bg-muted/50 ${isSelected ? 'border-primary bg-primary/5' : ''} ${selectionMode && !isApplied ? 'pl-14' : ''}`}>
                                                <CardContent className="px-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start gap-3 mb-2">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isApplied ? 'bg-green-500/10' : 'bg-muted'}`}>
                                                                    {isApplied ? (
                                                                        <Check className="w-5 h-5 text-green-600" />
                                                                    ) : (
                                                                        <Building2 className="w-5 h-5 text-muted-foreground" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                                                                        {isApplied && (
                                                                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-600">
                                                                                Applied
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-muted-foreground font-medium">{job.company}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-4 h-4" />
                                                                    {job.location}
                                                                </span>
                                                                <span className="px-2 py-1 rounded bg-muted text-xs">
                                                                    {job.experience_level.replace('_', ' ')} Level
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            </div>

                                                            {/* Skills */}
                                                            {job.skills.length > 0 && (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {job.skills.slice(0, 4).map((skill, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="px-2 py-1 rounded bg-muted text-xs"
                                                                        >
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                    {job.skills.length > 4 && (
                                                                        <span className="px-2 py-1 rounded bg-muted text-xs text-muted-foreground">
                                                                            +{job.skills.length - 4} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Match Score */}
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                                                    <Sparkles className="w-4 h-4" />
                                                                    {matchScores[job.id] !== undefined && matchScores[job.id] !== null
                                                                        ? `${matchScores[job.id]}%`
                                                                        : loadingMatchScores ? '...' : '--%'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">Match</div>
                                                            </div>
                                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && hasNext && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={!hasNext}
                            >
                                Load More Jobs
                            </Button>
                        </div>
                    )}
                </div>

                {/* Floating Bulk Apply Bar */}
                {selectedJobIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                        <Card className="shadow-lg border">
                            <CardContent className="px-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                        <span className="font-medium">{selectedJobIds.size} job{selectedJobIds.size > 1 ? 's' : ''} selected</span>
                                    </div>
                                    <Button
                                        onClick={() => setApplyModalOpen(true)}
                                        size="sm"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Apply to All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={clearSelection}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Apply Modal for Bulk Apply */}
                <ApplyModal
                    open={applyModalOpen}
                    onOpenChange={setApplyModalOpen}
                    jobs={selectedJobs}
                    onSuccess={handleBulkApplySuccess}
                />
            </div>
        </ProtectedRoute>
    );
}
