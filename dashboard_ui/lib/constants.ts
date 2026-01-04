import { ClinicStatus, SidebarRoute, Routes } from "./types";

export const CLINIC_STATUS_COLOR: Record<ClinicStatus, string> = {
  [ClinicStatus.NOT_QUEUED]: "bg-slate-100 text-slate-500",
  [ClinicStatus.NOT_CONTACTED]: "bg-slate-100 text-slate-700",
  [ClinicStatus.EMAIL_1_SENT]: "bg-orange-100 text-orange-700",  
  [ClinicStatus.FOLLOW_UP_1]: "bg-orange-200 text-orange-800", 
  [ClinicStatus.FOLLOW_UP_2]: "bg-orange-300 text-orange-900", 
  [ClinicStatus.REPLIED]: "bg-green-100 text-green-700",
};

export const SIDEBAR_ROUTES: SidebarRoute[] = [
  { label: "Dashboard", href: Routes.DASHBOARD },
  { label: "Analytics", href: Routes.ANALYTICS }
];