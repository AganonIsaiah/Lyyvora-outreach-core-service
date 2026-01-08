import { ClinicStatus, SidebarRoute, Routes } from "./types";

export const CLINIC_STATUS_COLOR: Record<ClinicStatus, string> = {
  [ClinicStatus.NOT_QUEUED]: "bg-slate-100 text-slate-400",
  [ClinicStatus.NOT_CONTACTED]: "bg-slate-100 text-slate-700",
  [ClinicStatus.EMAIL_1_SENT]: "bg-orange-100 text-orange-700",
  [ClinicStatus.FOLLOW_UP_1]: "bg-orange-200 text-orange-800",
  [ClinicStatus.FOLLOW_UP_2]: "bg-orange-300 text-orange-900",
  [ClinicStatus.REPLIED]: "bg-green-100 text-green-700",
  [ClinicStatus.CLOSED]: "bg-red-100 text-red-700",
};

export const SIDEBAR_ROUTES: SidebarRoute[] = [
  { label: "Dashboard", href: Routes.DASHBOARD },
];

export const IMPORT_COLUMNS: string[] = [
  "business_name",
  "business_website",
  "business_phone",
  "email_1",
  "email_2 (optional)",
  "type",
  "sub_types",
  "city",
  "state",
  "country",
  "total_reviews",
  "average_rating",
  "website_desc",
];

export const EXPORT_COLUMNS: string[] = [
  "clinic_name",
  "email",
  "subject_line",
  "email_body",
  "clinic_type",
  "city",
  "province",
];
