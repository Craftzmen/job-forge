import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: 'http://localhost:8001/api',
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8001/api/auth/token/refresh/', {
            refresh: refreshToken,
          });
          const { access } = response.data;
          Cookies.set('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Resume Types
// ============================================

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
  field: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface Resume {
  id: number;
  title: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  links: Link[];
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeCreateInput {
  title: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: Link[];
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  is_active?: boolean;
}

export interface ResumeUpdateInput extends Partial<ResumeCreateInput> { }

// ============================================
// Resume API Functions
// ============================================

export const resumeApi = {
  // Get all resumes for the current user
  getAll: async (): Promise<Resume[]> => {
    const response = await api.get('/resumes/');
    return response.data;
  },

  // Get a single resume by ID
  getById: async (id: number): Promise<Resume> => {
    const response = await api.get(`/resumes/${id}/`);
    return response.data;
  },

  // Create a new resume
  create: async (data: ResumeCreateInput): Promise<Resume> => {
    const response = await api.post('/resumes/', data);
    return response.data;
  },

  // Update an existing resume
  update: async (id: number, data: ResumeUpdateInput): Promise<Resume> => {
    const response = await api.put(`/resumes/${id}/`, data);
    return response.data;
  },

  // Delete a resume
  delete: async (id: number): Promise<void> => {
    await api.delete(`/resumes/${id}/`);
  },

  // Set a resume as active
  setActive: async (id: number): Promise<Resume> => {
    const response = await api.post(`/resumes/${id}/set_active/`);
    return response.data;
  },

  // Get the current active resume
  getActive: async (): Promise<Resume | null> => {
    try {
      const response = await api.get('/resumes/active/');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

// ============================================
// Job Types
// ============================================

export type ExperienceLevel = 'entry' | 'mid' | 'senior';

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience_level: ExperienceLevel;
  posted_by: number;
  posted_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Job[];
}

export interface JobCreateInput {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  experience_level?: ExperienceLevel;
}

export interface JobUpdateInput extends Partial<JobCreateInput> { }

export interface JobFilters {
  page?: number;
  search?: string;
  location?: string;
  skills?: string;
  experience_level?: ExperienceLevel;
}

// ============================================
// Job API Functions
// ============================================

export const jobApi = {
  // Get all jobs with optional filters
  getAll: async (filters?: JobFilters): Promise<JobListResponse> => {
    const response = await api.get('/jobs/', { params: filters });
    return response.data;
  },

  // Get a single job by ID
  getById: async (id: number): Promise<Job> => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  // Create a new job (admin only)
  create: async (data: JobCreateInput): Promise<Job> => {
    const response = await api.post('/jobs/', data);
    return response.data;
  },

  // Update an existing job (admin only)
  update: async (id: number, data: JobUpdateInput): Promise<Job> => {
    const response = await api.put(`/jobs/${id}/`, data);
    return response.data;
  },

  // Delete a job (admin only)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/jobs/${id}/`);
  },

  // Get company statistics
  getCompanyStats: async (): Promise<{
    active_jobs: number;
    total_applications: number;
    weekly_applications: number;
  }> => {
    const response = await api.get('/jobs/company_stats/');
    return response.data;
  },
};

// ============================================
// Application Types
// ============================================

export interface Application {
  id: number;
  job: number;
  job_title: string;
  company: string;
  user: number;
  username: string;
  user_name: string;
  resume: number | null;
  resume_title: string | null;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  cover_letter: string;
  ai_generated_cover_letter?: string;
  match_score?: number | null;
  match_breakdown?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface ApplicationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Application[];
}

export interface BulkApplicationInput {
  job_ids: number[];
  resume_id?: number | null;
  cover_letter?: string;
}

// ============================================
// Application API Functions
// ============================================

export const applicationApi = {
  getAll: async (params?: any): Promise<ApplicationListResponse> => {
    const response = await api.get('/jobs/applications/', { params });
    return response.data;
  },
  getById: async (id: number): Promise<Application> => {
    const response = await api.get(`/jobs/applications/${id}/`);
    return response.data;
  },
  create: async (data: { job: number; resume?: number | null; cover_letter?: string }): Promise<Application> => {
    const response = await api.post('/jobs/applications/', data);
    return response.data;
  },
  createBulk: async (data: BulkApplicationInput): Promise<Application[]> => {
    const response = await api.post('/jobs/applications/', data);
    return response.data;
  },
  update: async (id: number, data: any): Promise<Application> => {
    const response = await api.patch(`/jobs/applications/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/jobs/applications/${id}/`);
  },
  checkApplied: async (jobIds: number[]): Promise<Record<string, number>> => {
    const response = await api.get('/jobs/applications/check-applied/', {
      params: { job_ids: jobIds.join(',') }
    });
    return response.data;
  },

  // Get recent applications for company users
  getRecent: async (): Promise<Application[]> => {
    const response = await api.get('/jobs/applications/recent/');
    return response.data;
  },
};

// ============================================
// User Types (Admin)
// ============================================

export interface UserAdmin {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserAdmin[];
}

// ============================================
// User API Functions (Admin)
// ============================================

export const userApi = {
  getAll: async (params?: any): Promise<UserListResponse> => {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  },
  getById: async (id: number): Promise<UserAdmin> => {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  },
  update: async (id: number, data: any): Promise<UserAdmin> => {
    const response = await api.patch(`/auth/users/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}/`);
  },
};

// ============================================
// AI Types
// ============================================

export interface JobMatch extends Job {
  match_score: number;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  location_score: number;
  matching_skills: string[];
  missing_skills: string[];
  match_explanation: string;
}

export interface JobRecommendationsResponse {
  recommendations: JobMatch[];
  resume_id: number;
  resume_title: string;
  total_jobs: number;
  matched_jobs: number;
}

export interface CoverLetterResponse {
  cover_letter: string;
  generated_by: 'openai' | 'template';
  model: string | null;
  editable: boolean;
  job_id: number;
  resume_id: number;
}

export interface MatchScoreResponse {
  overall_score: number;
  semantic_score: number;
  skill_score: number;
  experience_score: number;
  location_score: number;
  matching_skills: string[];
  missing_skills: string[];
  explanation: string;
  job: {
    id: number;
    title: string;
    company: string;
  };
  resume_id: number;
}

export interface BulkMatchScoreResponse {
  scores: Array<{
    job_id: number;
    overall_score: number | null;
    matching_skills?: string[];
    missing_skills?: string[];
    error?: string;
  }>;
  resume_id: number;
}

export interface AssistanceResponse {
  content: string;
  generated_by: string;
  error?: string;
}

// ============================================
// AI API Functions
// ============================================

export const aiApi = {
  // Get AI-powered job recommendations
  getRecommendations: async (params?: {
    limit?: number;
    experience_level?: ExperienceLevel;
    location?: string;
    min_score?: number;
  }): Promise<JobRecommendationsResponse> => {
    const response = await api.get('/ai/recommendations/', { params });
    return response.data;
  },

  // Generate an AI cover letter
  generateCoverLetter: async (data: {
    job_id: number;
    resume_id?: number;
    custom_instructions?: string;
  }): Promise<CoverLetterResponse> => {
    const response = await api.post('/ai/generate-cover-letter/', data);
    return response.data;
  },

  // Regenerate cover letter with feedback
  regenerateCoverLetter: async (data: {
    job_id: number;
    resume_id?: number;
    previous_letter: string;
    feedback: string;
  }): Promise<CoverLetterResponse> => {
    const response = await api.post('/ai/regenerate-cover-letter/', data);
    return response.data;
  },

  // Get match score for a specific job
  getMatchScore: async (data: {
    job_id: number;
    resume_id?: number;
  }): Promise<MatchScoreResponse> => {
    const response = await api.post('/ai/match-score/', data);
    return response.data;
  },

  // Get match scores for multiple jobs
  getBulkMatchScores: async (data: {
    job_ids: number[];
    resume_id?: number;
  }): Promise<BulkMatchScoreResponse> => {
    const response = await api.post('/ai/bulk-match-scores/', data);
    return response.data;
  },

  // Get cover letter for an application
  getApplicationCoverLetter: async (applicationId: number): Promise<{
    id: number;
    job_id: number;
    job_title: string;
    company: string;
    cover_letter: string;
    ai_generated_cover_letter: string;
    match_score: number | null;
    match_breakdown: Record<string, number>;
    status: string;
    created_at: string;
  }> => {
    const response = await api.get(`/ai/applications/${applicationId}/cover-letter/`);
    return response.data;
  },
  // Assistance endpoints
  summarizeResume: async (data: {
    title: string;
    skills?: string[];
    experience?: any[];
  }): Promise<AssistanceResponse> => {
    const response = await api.post('/ai/resume/summary-assist/', data);
    return response.data;
  },
  suggestSkills: async (data: {
    title: string;
    current_skills?: string[];
  }): Promise<AssistanceResponse> => {
    const response = await api.post('/ai/resume/skills-assist/', data);
    return response.data;
  },
  assistJobDescription: async (data: {
    title: string;
    company: string;
    context?: string;
  }): Promise<AssistanceResponse> => {
    const response = await api.post('/ai/resume/job-description-assist/', data);
    return response.data;
  },
};

export default api;
