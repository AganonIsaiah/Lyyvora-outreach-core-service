export enum ClinicStatus {
  NOT_CONTACTED = "Not Contacted",
  EMAIL_1_SENT = "Email 1 Sent",
  FOLLOW_UP_1 = "Follow-up 1",
  FOLLOW_UP_2 = "Follow-up 2",
  REPLIED = "Replied",
}

export enum Routes {
  DASHBOARD = "/dashboard",
  ANALYTICS = "/analytics"
}

export interface SidebarRoute {
  label: string;
  href: Routes;
}

export interface Clinic {
  id: string
  name: string 
  type: string[]
  city: string 
  province: string 
  status: ClinicStatus
  lastContactDate: string 
  nextContactDate: string 
  notes: string
}