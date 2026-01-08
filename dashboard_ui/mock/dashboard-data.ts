import {
  Clinic,
  ClinicStatus,
  Filter,
  ClinicEmails,
  Metric,
  DashboardResponse,
  CampaignStatus
} from "@/lib/types";

const defaultPrompt = `ROLE
        You are Sharmeen Aqeel, Founder and CEO of Lyyvora.

        FACTUAL CONTEXT (USE AS GIVEN — DO NOT MODIFY)
        Lyyvora facts you may reference:
        - Lending-as-a-Service platform for healthcare clinics and pharmacies

        IMPORTANT:
        - Use these facts naturally if relevant
        - Do NOT invent new metrics, numbers, partnerships, or claims
        - Do NOT exaggerate outcomes or imply guaranteed funding

        TASK
        Write a personalized outreach emails (maximum {MAX_WORDS} words). 

        PERSONALIZATION INPUT
        Incorporate this information where appropriate:
        - Clinic: {clinic_info.get('clinic_name', 'N/A')}
        - Clinic's specialties: {clinic_info.get('clinic_sub_type', 'N/A')}
        - Clinic's location: {clinic_info.get('city', 'N/A')}
        - Clinic background context: {clinic_info.get('website_desc', 'N/A')}

        EMAIL STRUCTURE
        1. Personal opening:
        - Reference the clinic’s specialty, services, or mission
        - Show genuine awareness (not generic praise)

        2. Founder introduction:
        - Introduce yourself as Founder & CEO of Lyyvora
        - Briefly explain what motivated you to build Lyyvora

        3. Relevance to them:
        - Connect what you’re building to the realities of running a clinic
        - Keep this grounded and non-promotional

        4. Soft close:
        - End with one calm, low-pressure question
        - Invite them to reply directly if open to a conversation
   
        STYLE GUIDELINES
        - First-person, founder-to-founder voice
        - Reflective, credible, and calm
        - No sales language, no buzzwords
        - 2–4 short paragraphs
        - For the subject lines, use title case

        CALL-TO-ACTION
        - Do NOT include links or URLs
        - Use exactly one CTA
        - CTA must invite replying directly to the email

        STRICT GUARDRAILS
        - Do NOT promise funding, approval, or outcomes
        - Do NOT add statistics beyond those listed
        - Do NOT include placeholders or bracketed text
        - Stay within the word limit

        OUTPUT
        subject_line: <one concise subject line>
        email_body: <email body>
`;

const defaultEmails = (clinicName: string): ClinicEmails[] => [
  {
    type: "Email 1",
    subjectLine: `Quick question about ${clinicName}`,
    emailBody: `Hi there,\n\nI came across ${clinicName} and thought it would be great to connect. Would you be open to a quick chat?\n\nBest regards,`,
  },
  {
    type: "Follow-up 1",
    subjectLine: `Following up — ${clinicName}`,
    emailBody: `Hi again,\n\nJust following up on my previous email in case it got buried. Looking forward to hearing your thoughts.\n\nBest,`,
  },
  {
    type: "Follow-up 2",
    subjectLine: `Last follow-up — ${clinicName}`,
    emailBody: `Hi,\n\nThis will be my last follow-up. Happy to reconnect whenever the timing is right.\n\nThanks!`,
  },
];

const getUniqueValues = (clinics: Clinic[], key: keyof Clinic) => {
  const values = clinics
    .map((c) => c[key])
    .flat() 
    .filter(Boolean);
  return Array.from(new Set(values)) as string[];
};

const getStatusValues = () => Object.values(ClinicStatus);

export const mockClinicsData: Clinic[] = [
  {
    id: "0",
    name: "Aganon's Clinic",
    email: "info@mock.com",
    website_url: "https://clinicalpha.com",
    top_features: "Advanced equipment, Certified specialists",
    type: ["Spa"],
    city: "Toronto",
    province: "Ontario",
    status: ClinicStatus.NOT_QUEUED,
    total_reviews: 25,
    average_rating: 4.7,
    lead_score: 91,
    notes: "New lead, no contact made yet.",
    emails_for_outreach: defaultEmails("Clinic Alpha"),
  },
  {
    id: "1",
    name: "Clinic Alpha",
    email: "info@clinicalpha.com",
    website_url: "https://clinicalpha.com",
    top_features: "Advanced equipment, Certified specialists",
    type: ["Spa", "Med-spa"],
    city: "Toronto",
    province: "Ontario",
    status: ClinicStatus.NOT_CONTACTED,
    total_reviews: 45,
    average_rating: 4.5,
    lead_score: 80,
    next_contact_date: "Dec 26, 2025",
    notes: "New lead, no contact made yet.",
    emails_for_outreach: defaultEmails("Clinic Alpha"),
  },
  {
    id: "2",
    name: "Health First Clinic",
    email: "hello@healthfirst.com",
    website_url: "https://healthfirst.com",
    top_features: "Rehab programs, Expert staff",
    type: ["Medical", "Physiotherapy"],
    city: "Ottawa",
    province: "Ontario",
    status: ClinicStatus.EMAIL_1_SENT,
    total_reviews: 30,
    average_rating: 4.2,
    lead_score: 75,
    last_contact_date: "Dec 19, 2025",
    next_contact_date: "Dec 26, 2025",
    notes: "Introductory email sent.",
    emails_for_outreach: defaultEmails("Health First Clinic"),
  },
  {
    id: "3",
    name: "Downtown Wellness Center",
    email: "contact@downtownwellness.com",
    website_url: "https://downtownwellness.com",
    top_features: "Central location, Flexible hours",
    type: ["Chiropractic", "Massage"],
    city: "Vancouver",
    province: "British Columbia",
    status: ClinicStatus.FOLLOW_UP_1,
    total_reviews: 50,
    average_rating: 4.7,
    lead_score: 85,
    last_contact_date: "Dec 18, 2025",
    next_contact_date: "Dec 25, 2025",
    notes: "Waiting for response.",
    emails_for_outreach: defaultEmails("Downtown Wellness Center"),
  },
  {
    id: "4",
    name: "Pure Med Spa",
    email: "info@puremedspa.com",
    website_url: "https://puremedspa.com",
    top_features: "Luxury experience, Skilled aestheticians",
    type: ["Med-spa"],
    city: "Calgary",
    province: "Alberta",
    status: ClinicStatus.FOLLOW_UP_2,
    total_reviews: 40,
    average_rating: 4.3,
    lead_score: 70,
    last_contact_date: "Dec 20, 2025",
    next_contact_date: "Dec 30, 2025",
    notes: "Second follow-up scheduled.",
    emails_for_outreach: defaultEmails("Pure Med Spa"),
  },
  {
    id: "5",
    name: "Maple Leaf Clinic",
    email: "contact@mapleleafclinic.com",
    website_url: "https://mapleleafclinic.com",
    top_features: "Skin care specialists, Modern tech",
    type: ["Medical", "Dermatology"],
    city: "Montreal",
    province: "Quebec",
    status: ClinicStatus.REPLIED,
    total_reviews: 60,
    average_rating: 4.8,
    lead_score: 90,
    last_contact_date: "Dec 10, 2025",
    notes: "Client replied. Proposal in progress.",
    emails_for_outreach: defaultEmails("Maple Leaf Clinic"),
  },
  {
    id: "6",
    name: "Serenity Spa & Wellness",
    email: "hello@serenityspa.com",
    website_url: "https://serenityspa.com",
    top_features: "Holistic care, Peaceful environment",
    type: ["Spa", "Yoga"],
    city: "Halifax",
    province: "Nova Scotia",
    status: ClinicStatus.CLOSED,
    total_reviews: 25,
    average_rating: 4.0,
    lead_score: 65,
    last_contact_date: "Dec 28, 2025",
    notes: "Lyyvora replied, close outreach.",
    emails_for_outreach: defaultEmails("Serenity Spa & Wellness"),
  },
  {
    id: "7",
    name: "City Health Center",
    email: "info@cityhealth.com",
    website_url: "https://cityhealth.com",
    top_features: "Rehab focus, Certified therapists",
    type: ["Medical", "Physiotherapy"],
    city: "Winnipeg",
    province: "Manitoba",
    status: ClinicStatus.EMAIL_1_SENT,
    total_reviews: 35,
    average_rating: 4.3,
    lead_score: 78,
    last_contact_date: "Dec 15, 2025",
    next_contact_date: "Dec 22, 2025",
    notes: "Initial email sent.",
    emails_for_outreach: defaultEmails("City Health Center"),
  },
  {
    id: "8",
    name: "Harmony Med Spa",
    email: "contact@harmonymedspa.com",
    website_url: "https://harmonymedspa.com",
    top_features: "Laser treatments, Skin experts",
    type: ["Med-spa", "Skin Care"],
    city: "Edmonton",
    province: "Alberta",
    status: ClinicStatus.FOLLOW_UP_1,
    total_reviews: 40,
    average_rating: 4.4,
    lead_score: 82,
    last_contact_date: "Dec 14, 2025",
    next_contact_date: "Dec 21, 2025",
    notes: "Follow-up pending.",
    emails_for_outreach: defaultEmails("Harmony Med Spa"),
  },

  {
    id: "9",
    name: "Greenfield Clinic",
    email: "hello@greenfieldclinic.com",
    website_url: "https://greenfieldclinic.com",
    top_features: "Family care, Modern equipment",
    type: ["Medical", "Dental"],
    city: "Quebec City",
    province: "Quebec",
    status: ClinicStatus.FOLLOW_UP_2,
    total_reviews: 55,
    average_rating: 4.6,
    lead_score: 88,
    last_contact_date: "Dec 13, 2025",
    next_contact_date: "Dec 20, 2025",
    notes: "Second follow-up.",
    emails_for_outreach: defaultEmails("Greenfield Clinic"),
  },
  {
    id: "10",
    name: "Zen Wellness",
    email: "info@zenwellness.com",
    website_url: "https://zenwellness.com",
    top_features: "Mindfulness programs, Yoga experts",
    type: ["Spa", "Yoga"],
    city: "Victoria",
    province: "British Columbia",
    status: ClinicStatus.REPLIED,
    total_reviews: 52,
    average_rating: 4.7,
    lead_score: 88,
    last_contact_date: "Dec 11, 2025",
    notes: "Client responded positively.",
    emails_for_outreach: defaultEmails("Zen Wellness"),
  },
  {
    id: "11",
    name: "Tranquility Health Center",
    email: "info@tranquilityhealth.com",
    website_url: "https://tranquilityhealth.com",
    top_features: "Family care, Modern facilities",
    type: ["Medical", "Dental"],
    city: "Ottawa",
    province: "Ontario",
    status: ClinicStatus.REPLIED,
    total_reviews: 51,
    average_rating: 4.7,
    lead_score: 87,
    last_contact_date: "Dec 10, 2025",
    next_contact_date: "Dec 17, 2025",
    notes: "Client responded, proposal in progress.",
    emails_for_outreach: defaultEmails("Tranquility Health Center"),
  },
];

export const mockFilters: Filter[] = [
   {
    key: "name",
    label: "Name",
    values: getUniqueValues(mockClinicsData, "name"),
    type: "select",
  },
  {
    key: "type",
    label: "Type",
    values: getUniqueValues(mockClinicsData, "type"),
    type: "select",
  },
  {
    key: "city",
    label: "City",
    values: getUniqueValues(mockClinicsData, "city"),
    type: "select",
  },
  {
    key: "province",
    label: "Province",
    values: getUniqueValues(mockClinicsData, "province"),
    type: "select",
  },
  {
    key: "status",
    label: "Status",
    values: getStatusValues(),
    type: "select",
  },
  // Sorting filters
  {
    key: "lead_score",
    label: "Lead Score",
    values: ["Asc", "Desc"],
    type: "sort",
  },
  {
    key: "average_rating",
    label: "Average Rating",
    values: ["Asc", "Desc"],
    type: "sort",
  },
  {
    key: "last_contact_date",
    label: "Last Contact Date",
    values: ["Asc", "Desc"],
    type: "sort",
  },
  {
    key: "next_contact_date",
    label: "Next Contact Date",
    values: ["Asc", "Desc"],
    type: "sort",
  },
];

export const mockMetrics: Metric[] = [
  {
    label: "Total Clinics",
    value: 591,
    desc: "this week",
    descValue: 52,
  },
  {
    label: "Emails Sent Today",
    value: 10,
    desc: "Daily limit reached"
  },
  {
    label: "Active Campaigns",
    value: 127,
    desc: "reply rate",
    descValue: 0.23,
  },
  {
    label: "Replied Received",
    value: 29,
    desc: "this week",
    descValue: -12,
  },
];

export const mockCampaignStatus: CampaignStatus = {
  daily_email_limit: 4,
  follow_up_1: 3,
  follow_up_2: 5,
  prompt: defaultPrompt,
  contacted_clinics: 51,
  total_clinics: 592,
  clinic_percentage: 0.08
}

export const mockDashboardResponse: DashboardResponse = {
  clinics_data: mockClinicsData,
  metrics: mockMetrics,
  filters: mockFilters,
  campaign_status: mockCampaignStatus,
}