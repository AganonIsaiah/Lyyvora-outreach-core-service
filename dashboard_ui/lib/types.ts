export enum ClinicStatus {
  NOT_GENERATED = "Not Generated",
  GENERATED = "Generated"
};

export enum Routes {
  DASHBOARD = "/dashboard",
  CLINICS = "/clinics"
};

export type FilterType = "select" | "sort";
export type EmailType = "Email 1" | "Follow-up 1" | "Follow-up 2";
export type FilterState = Record<string, string[]>;

export interface Filter {
  key: string;
  label: string;
  values: string[];
  type: FilterType;
}

export interface SidebarRoute {
  label: string;
  href: Routes;
};

export interface ClinicEmails {
  subject_line: string;
  email_body: string;
  type: EmailType;
}

export interface Clinic {
  id: number;
  name: string;
  email: string;
  website_url: string; 
  type: string[];
  city: string; 
  province: string; 
  email_status: ClinicStatus;
  total_reviews: number; 
  average_rating: number;
  lead_score: number;
  notes: string;
  top_features: string;
  emails_for_outreach: ClinicEmails[];  
  campaign_batch: string;
};

export interface Metric {
  label: string;
  value: number;
  desc: string;
  desc_value?: number;
}

export interface CampaignStatus {
  max_word_limit: number;
  number_of_clinics: number;
  prompt: string;
  total_clinics: number;
}

export interface DashboardResponse {
  clinics_data: Clinic[];
  metrics: Metric[];
  filters: Filter[];
  campaign_status: CampaignStatus;
  show_export: boolean;
  total_clinics: number;
  filtered_clinics_count: number;
  not_generated_emails_count: number;
}