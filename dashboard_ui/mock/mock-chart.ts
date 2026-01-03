import { Clinic, ClinicStatus } from "@/lib/types";

export const mockClinicTable: Clinic[] = [
  {
    id: "1",
    name: "Clinic Alpha",
    type: ["Spa", "Med-spa"],
    city: "Toronto",
    province: "Ontario",
    status: ClinicStatus.NOT_CONTACTED,
    lastContactDate: "Dec 21, 2025",
    nextContactDate: "Dec 26, 2025",
    notes: "New lead, no contact made yet."
  },
  {
    id: "2",
    name: "Health First Clinic",
    type: ["Medical", "Physiotherapy"],
    city: "Ottawa",
    province: "Ontario",
    status: ClinicStatus.EMAIL_1_SENT,
    lastContactDate: "Dec 19, 2025",
    nextContactDate: "Dec 26, 2025",
    notes: "Introductory email sent."
  },
  {
    id: "3",
    name: "Downtown Wellness Center",
    type: ["Chiropractic", "Massage"],
    city: "Vancouver",
    province: "British Columbia",
    status: ClinicStatus.FOLLOW_UP_1,
    lastContactDate: "Dec 18, 2025",
    nextContactDate: "Dec 25, 2025",
    notes: "Waiting for response after first follow-up."
  },
  {
    id: "4",
    name: "Pure Med Spa",
    type: ["Med-spa"],
    city: "Calgary",
    province: "Alberta",
    status: ClinicStatus.FOLLOW_UP_2,
    lastContactDate: "Dec 20, 2025",
    nextContactDate: "Dec 30, 2025",
    notes: "Second follow-up scheduled."
  },
  {
    id: "5",
    name: "Maple Leaf Clinic",
    type: ["Medical", "Dermatology"],
    city: "Montreal",
    province: "Quebec",
    status: ClinicStatus.REPLIED,
    lastContactDate: "Dec 10, 2025",
    nextContactDate: "Dec 27, 2025",
    notes: "Client replied. Proposal in progress."
  },
  {
    id: "6",
    name: "Serenity Spa & Wellness",
    type: ["Spa", "Yoga"],
    city: "Halifax",
    province: "Nova Scotia",
    status: ClinicStatus.NOT_CONTACTED,
    lastContactDate: "Dec 12, 2025",
    nextContactDate: "Dec 28, 2025",
    notes: "New lead. Waiting for outreach."
  },
  {
    id: "7",
    name: "City Health Center",
    type: ["Medical", "Physiotherapy"],
    city: "Winnipeg",
    province: "Manitoba",
    status: ClinicStatus.EMAIL_1_SENT,
    lastContactDate: "Dec 15, 2025",
    nextContactDate: "Dec 22, 2025",
    notes: "Initial email sent with brochure."
  },
  {
    id: "8",
    name: "Harmony Med Spa",
    type: ["Med-spa", "Skin Care"],
    city: "Edmonton",
    province: "Alberta",
    status: ClinicStatus.FOLLOW_UP_1,
    lastContactDate: "Dec 14, 2025",
    nextContactDate: "Dec 21, 2025",
    notes: "Follow-up pending after first contact."
  },
  {
    id: "9",
    name: "Greenfield Clinic",
    type: ["Medical", "Dental"],
    city: "Quebec City",
    province: "Quebec",
    status: ClinicStatus.FOLLOW_UP_2,
    lastContactDate: "Dec 13, 2025",
    nextContactDate: "Dec 20, 2025",
    notes: "Second follow-up in progress."
  },
  {
    id: "10",
    name: "Tranquil Wellness",
    type: ["Spa", "Yoga"],
    city: "Victoria",
    province: "British Columbia",
    status: ClinicStatus.REPLIED,
    lastContactDate: "Dec 11, 2025",
    nextContactDate: "Dec 18, 2025",
    notes: "Client responded positively to email."
  }
];