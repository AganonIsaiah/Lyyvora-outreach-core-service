import { ClinicStatus, SidebarRoute, Routes } from "./types";

export const CLINIC_STATUS_COLOR: Record<ClinicStatus, string> = {
  [ClinicStatus.NOT_GENERATED]: "bg-orange-100 text-orange-700",
  [ClinicStatus.GENERATED]: "bg-green-100 text-green-700",
  [ClinicStatus.EXPORTED]: "bg-red-400 text-white",
  [ClinicStatus.DELIVERED]: "bg-blue-100 text-blue-700",
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
