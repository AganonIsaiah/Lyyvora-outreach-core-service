import { ClinicStatus } from "./types";

export const CLINIC_STATUS_COLOR = {
  [ClinicStatus.NOT_CONTACTED]: "bg-slate-100 text-slate-700",
  [ClinicStatus.EMAIL_1_SENT]: "bg-blue-100 text-blue-700",
  [ClinicStatus.FOLLOW_UP_1]: "bg-amber-100 text-amber-700",
  [ClinicStatus.FOLLOW_UP_2]: "bg-orange-100 text-orange-700",
  [ClinicStatus.REPLIED]: "bg-green-100 text-green-700",
}