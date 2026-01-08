export enum ClinicStatus {
  NOT_QUEUED = "Not Queued",
  NOT_CONTACTED = "Not Contacted",
  EMAIL_1_SENT = "Email 1 Sent",
  FOLLOW_UP_1 = "Follow-up 1",
  FOLLOW_UP_2 = "Follow-up 2",
  REPLIED = "Replied",
  CLOSED = "Closed"
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
  subjectLine: string;
  emailBody: string;
  type: EmailType;
}

export interface Clinic {
  id: string;
  name: string;
  email: string;
  website_url: string; 
  type: string[];
  city: string; 
  province: string; 
  status: ClinicStatus;
  total_reviews: number; 
  average_rating: number;
  lead_score: number;
  last_contact_date?: string; 
  next_contact_date?: string; 
  notes: string; // Maps to website_dsc
  top_features: string;
  emails_for_outreach: ClinicEmails[];  
};

export interface Metric {
  label: string;
  value: number;
  desc: string;
  descValue?: number;
}

export interface CampaignStatus {
  daily_email_limit: number;
  follow_up_1: number;
  follow_up_2: number;
  prompt: string;
  contacted_clinics: number;
  total_clinics: number;
  clinic_percentage: number;
}

export interface DashboardResponse {
  clinics_data: Clinic[];
  metrics: Metric[];
  filters: Filter[];
  campaign_status: CampaignStatus;
}