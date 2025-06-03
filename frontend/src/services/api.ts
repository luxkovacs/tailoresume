import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Define TypeScript types for Skills based on backend schemas
export enum ExperienceLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate", 
  ADVANCED = "Advanced",
  EXPERT = "Expert",
}

export interface SkillBase {
  name: string;
  experience_level: ExperienceLevel;
  category?: string;
  years_of_experience?: number;
  details?: string;
  keywords?: string;
}

export interface SkillCreate extends SkillBase {}

export interface SkillUpdate {
  name?: string;
  experience_level?: ExperienceLevel;
  category?: string;
  years_of_experience?: number;
  details?: string;
  keywords?: string;
}

export interface Skill extends SkillBase {
  id: number;
  user_id: number;
}

// Anti-Hallucination types
export interface DatabankCoverage {
  coverage_summary: {
    skills: {
      covered: number;
      required: number;
      percentage: number;
      missing_required: string[];
      missing_preferred: string[];
    };
    experience: {
      meets_requirements: boolean;
      user_years: number;
      required_years: number;
      gap_analysis: string;
    };
    education: {
      meets_requirements: boolean;
      user_education: string[];
      required_education: string[];
      gaps: string[];
    };
    certifications: {
      relevant_count: number;
      preferred_count: number;
      missing: string[];
    };
  };
  critical_gaps: string[];
  transferable_skills: Array<{
    user_skill: string;
    target_skill: string;
    transferability_strength: string;
    reasoning: string;
  }>;
  databank_utilization_percentage: number;
}

export interface GapRecommendation {
  category: string;
  item_type: string;
  suggestion: string;
  priority: string;
  reasoning: string;
}

export interface DatabankValidationRequest {
  job_description: string;
}

export interface DatabankEnhancementRequest {
  job_description: string;
}

export interface DatabankEnhancementResponse {
  recommendations: GapRecommendation[];
  priority_order: string[];
  estimated_improvement: {
    skills_coverage: number;
    overall_match: number;
  };
}

export interface AntiHallucinationResumeRequest {
  job_description: string;
  max_databank_utilization?: boolean;
}

export interface AntiHallucinationResumeResponse {
  resume_content: any;
  databank_utilization_report: {
    content_sources?: string[];
    utilization_percentage?: number;
    unused_databank_content?: string[];
    identified_gaps?: string[];
  };
  coverage_analysis: DatabankCoverage;
  enhancement_suggestions: GapRecommendation[];
}

// Define TypeScript types for Work Experience based on backend schemas
export interface WorkExperienceBase {
  company: string;
  job_title: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string, optional
  is_current: boolean;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  responsibilities?: string;
  achievements?: string;
}

export interface WorkExperienceCreate extends WorkExperienceBase {}

export interface WorkExperienceUpdate {
  company?: string;
  job_title?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  responsibilities?: string;
  achievements?: string;
}

export interface WorkExperience extends WorkExperienceBase {
  id: number;
  user_id: number;
}

// Define TypeScript types for Education based on backend schemas
export interface EducationBase {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string, optional
  is_current: boolean;
  city?: string;
  state?: string;
  country?: string;
  gpa?: string;
  achievements?: string;
  activities?: string;
}

export interface EducationCreate extends EducationBase {}

export interface EducationUpdate {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  city?: string;
  state?: string;
  country?: string;
  gpa?: string;
  achievements?: string;
  activities?: string;
}

export interface Education extends EducationBase {
  id: number;
  user_id: number;
}

// Define TypeScript types for Project based on backend schemas
export interface ProjectBase {
  name: string;
  description: string;
  url?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string, optional
  is_current: boolean;
  technologies?: string; // JSON string or comma-separated
}

export interface ProjectCreate extends ProjectBase {}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  technologies?: string;
}

export interface Project extends ProjectBase {
  id: number;
  user_id: number;
}

// Define TypeScript types for Certification based on backend schemas
export interface CertificationBase {
  name: string;
  issuing_organization: string;
  issue_date: string; // ISO date string
  expiration_date?: string; // ISO date string, optional
  credential_id?: string;
  credential_url?: string;
}

export interface CertificationCreate extends CertificationBase {}

export interface CertificationUpdate {
  name?: string;
  issuing_organization?: string;
  issue_date?: string;
  expiration_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Certification extends CertificationBase {
  id: number;
  user_id: number;
}

// Define TypeScript types for Language based on backend schemas
export interface LanguageBase {
  name: string;
  proficiency: string; // e.g., Native, Fluent, Intermediate, Basic
}

export interface LanguageCreate extends LanguageBase {}

export interface LanguageUpdate {
  name?: string;
  proficiency?: string;
}

export interface Language extends LanguageBase {
  id: number;
  user_id: number;
}

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a longer timeout for development
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Response Error:', error);
    
    // Check if the error is a timeout
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server might be down');
    }
    
    // Check if we got a response with error status
    if (error.response) {
      console.error(`Status: ${error.response.status} - ${error.response.statusText}`);
      console.error('Error data:', error.response.data);
      
      // Handle 401 Unauthorized - invalid token
      if (error.response.status === 401) {
        console.warn('401 Unauthorized - clearing invalid token');
        localStorage.removeItem('auth_token');
        
        // Trigger a custom event that the AuthContext can listen to
        window.dispatchEvent(new CustomEvent('auth-token-invalid'));
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic API service
class ApiService {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
  }

  // T is now a generic parameter for handleResponse itself
  private handleResponse<T>(response: AxiosResponse<any>): T {
    if (!response || response.data === undefined || response.data === null) {
      console.warn(`Response data is null or undefined from ${this.endpoint}`);
      // If T is expected to be an array (e.g., by getAll), 
      // the calling method (getAll) should handle returning [].
      // If T is an object, returning {} might be acceptable for null/undefined data.
      // This is a tricky spot for a generic handler. Let's assume if data is null/undefined,
      // and T is not explicitly an array type, {} is a safe-ish default for object types.
      // However, specific methods like getAll will override this for array expectations.
      return {} as T; 
    }
    return response.data as T;
  }

  getAll = async <TResult extends any[]>(params?: any, config?: AxiosRequestConfig): Promise<TResult> => {
    try {
      const response = await apiClient.get<TResult>(this.endpoint, { 
        params,
        ...config
      });
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // If backend returns null, undefined, or something not an array for a GET ALL endpoint,
      // return an empty array of the expected type.
      console.warn(`Expected array from ${this.endpoint} but received: ${JSON.stringify(response.data)}. Returning empty array.`);
      return [] as unknown as TResult;
    } catch (error) {
      console.error(`Error fetching all from ${this.endpoint}:`, error);
      // On any error (network, 4xx, 5xx), return an empty array for getAll.
      return [] as unknown as TResult;
    }
  };

  getById = async <T>(id: number | string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(`${this.endpoint}${id}`, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error fetching ${this.endpoint}${id}:`, error);
      throw error;
    }
  };

  create = async <T>(data: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(this.endpoint, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error creating at ${this.endpoint}:`, error);
      throw error;
    }
  };

  update = async <T>(id: number | string, data: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      // Ensure the ID is part of the path and a trailing slash if the API expects it for specific item operations
      const url = `${this.endpoint}${id}${this.endpoint.endsWith('/') ? '/' : ''}`;
      const response = await apiClient.put<T>(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`Error updating ${this.endpoint}${id}:`, error);
      throw error;
    }
  };

  delete = async (id: number | string, config?: AxiosRequestConfig): Promise<boolean> => {
    try {
      // Ensure the ID is part of the path and a trailing slash if the API expects it
      const url = `${this.endpoint}${id}${this.endpoint.endsWith('/') ? '/' : ''}`;
      await apiClient.delete(url, config);
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.endpoint}${id}:`, error);
      // For delete, we might want to rethrow to let UI handle failure explicitly
      throw error; 
    }
  };

  custom = async <TResult>(method: string, path: string, data?: any, config?: AxiosRequestConfig): Promise<TResult> => {
    try {
      const response = await apiClient.request<TResult>({
        method,
        url: `${this.endpoint}${path}`,
        data,
        ...config
      });
      return this.handleResponse<TResult>(response);
    } catch (error) {
      console.error(`Error in custom call ${method} ${this.endpoint}${path}:`, error);
      throw error;
    }
  };
}

// Create service instances for different endpoints
// Ensure endpoints have a trailing slash as FastAPI often uses them by default for collections
export const skillsService = new ApiService('/api/skills/');
export const workExperiencesService = new ApiService('/api/work-experiences/');
export const educationsService = new ApiService('/api/educations/');
export const projectsService = new ApiService('/api/projects/');
export const certificationsService = new ApiService('/api/certifications/');
export const languagesService = new ApiService('/api/languages/');
export const resumesService = new ApiService('/api/resumes/');
export const apiKeysService = new ApiService('/api/api-keys/');
export const jobAnalysisService = new ApiService('/api/job-analysis/');

// Specialized Anti-Hallucination Service
class AntiHallucinationService {
  private baseEndpoint = '/api/job-analysis';

  async validateDatabankCoverage(request: DatabankValidationRequest): Promise<DatabankCoverage> {
    try {
      const response = await apiClient.post<DatabankCoverage>(
        `${this.baseEndpoint}/validate-databank-coverage`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error validating databank coverage:', error);
      throw error;
    }
  }

  async suggestDatabankEnhancements(request: DatabankEnhancementRequest): Promise<DatabankEnhancementResponse> {
    try {
      const response = await apiClient.post<DatabankEnhancementResponse>(
        `${this.baseEndpoint}/suggest-databank-enhancements`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error suggesting databank enhancements:', error);
      throw error;
    }
  }

  async generateAntiHallucinationResume(request: AntiHallucinationResumeRequest): Promise<AntiHallucinationResumeResponse> {
    try {
      const response = await apiClient.post<AntiHallucinationResumeResponse>(
        `${this.baseEndpoint}/generate-anti-hallucination-resume`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error generating anti-hallucination resume:', error);
      throw error;
    }
  }
}

export const antiHallucinationService = new AntiHallucinationService();

// Export the API client for direct use
export default apiClient;