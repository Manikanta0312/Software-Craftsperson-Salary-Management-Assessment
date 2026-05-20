import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

// --- Types ---
export interface Employee {
  id: number;
  full_name: string;
  job_title: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  employment_type: string;
  hire_date: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  salary_history: SalaryHistory[];
}

export interface SalaryHistory {
  id: number;
  old_salary: number;
  new_salary: number;
  changed_at: string;
  reason?: string;
}

export interface PaginatedEmployees {
  total: number;
  page: number;
  page_size: number;
  items: Employee[];
}

export interface EmployeeFilters {
  page?: number;
  page_size?: number;
  search?: string;
  country?: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  min_salary?: number;
  max_salary?: number;
}

export interface AnalyticsSummary {
  total_employees: number;
  active_employees: number;
  global_min_salary: number;
  global_max_salary: number;
  global_avg_salary: number;
  total_payroll: number;
  countries_count: number;
  job_titles_count: number;
}

export interface CountrySalaryStats {
  country: string;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
  median_salary: number;
  headcount: number;
}

export interface JobTitleSalaryStats {
  job_title: string;
  country?: string;
  avg_salary: number;
  min_salary: number;
  max_salary: number;
  headcount: number;
}

export interface TopEarner {
  id: number;
  full_name: string;
  job_title: string;
  department: string;
  country: string;
  salary: number;
}

export interface SalaryBucket {
  range_label: string;
  count: number;
  min_val: number;
  max_val: number;
}

// --- API calls ---
export const employeesApi = {
  list: (filters: EmployeeFilters = {}) =>
    api.get<PaginatedEmployees>("/api/employees", { params: filters }),
  get: (id: number) => api.get<Employee>(`/api/employees/${id}`),
  create: (data: Omit<Employee, "id" | "is_active" | "created_at" | "updated_at" | "salary_history">) =>
    api.post<Employee>("/api/employees", data),
  update: (id: number, data: Partial<Employee>) =>
    api.put<Employee>(`/api/employees/${id}`, data),
  delete: (id: number) => api.delete(`/api/employees/${id}`),
};

export const analyticsApi = {
  summary: () => api.get<AnalyticsSummary>("/api/analytics/summary"),
  byCountry: () => api.get<CountrySalaryStats[]>("/api/analytics/by-country"),
  byJobTitle: (country?: string) =>
    api.get<JobTitleSalaryStats[]>("/api/analytics/by-job-title", { params: { country } }),
  topEarners: (limit = 10) =>
    api.get<TopEarner[]>(`/api/analytics/top-earners?limit=${limit}`),
  distribution: (buckets = 10) =>
    api.get<SalaryBucket[]>(`/api/analytics/salary-distribution?buckets=${buckets}`),
};
