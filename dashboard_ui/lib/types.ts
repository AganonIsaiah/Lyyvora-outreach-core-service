// Sort by Replied to Not queued
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
  ANALYTICS = "/analytics",
  GUIDE = "/guide"
};

export type FilterType = "select" | "sort";

export type EmailType = "Email 1" | "Follow-up 1" | "Follow-up 2";

export type FilterState = Record<string, string[]>;

export interface FilterConfig {
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
  websiteUrl: string; 
  type: string[];
  city: string; 
  province: string; 
  status: ClinicStatus;
  totalReviews: number; 
  averageRating: number;
  leadScore: number;
  lastContactDate?: string; 
  nextContactDate?: string; 
  notes: string; // Maps to website_dsc
  topFeatures: string;
  emailsForOutreach: ClinicEmails[];  
};