import {
  Clinic,
  ClinicStatus,
  Filter,
  ClinicEmails,
  Metric,
  DashboardResponse,
  CampaignStatus,
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
    subject_line: `Quick question about ${clinicName}`,
    email_body: `Hi there,\n\nI came across ${clinicName} and thought it would be great to connect. Would you be open to a quick chat?\n\nBest regards,`,
  },
  {
    type: "Follow-up 1",
    subject_line: `Following up — ${clinicName}`,
    email_body: `Hi again,\n\nJust following up on my previous email in case it got buried. Looking forward to hearing your thoughts.\n\nBest,`,
  },
  {
    type: "Follow-up 2",
    subject_line: `Last follow-up — ${clinicName}`,
    email_body: `Hi,\n\nThis will be my last follow-up. Happy to reconnect whenever the timing is right.\n\nThanks!`,
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
    id: 0,
    name: "Aganon's Clinic",
    email: "info@mock.com",
    website_url: "https://clinicalpha.com",
    top_features: "Advanced equipment, Certified specialists",
    type: ["Spa"],
    city: "Toronto",
    province: "Ontario",
    email_status: ClinicStatus.NOT_GENERATED,
    total_reviews: 25,
    average_rating: 4.7,
    lead_score: 91,
    notes: "New lead, no contact made yet.",
    emails_for_outreach: defaultEmails("Clinic Alpha"),
    campaign_batch: "test batch",
    phone: "1234567890",
  },
  {
    id: 1,
    name: "Aganon's Clinic",
    email: "info@mock.com",
    website_url: "https://clinicalpha.com",
    top_features: "Advanced equipment, Certified specialists",
    type: ["Spa"],
    city: "Toronto",
    province: "Ontario",
    email_status: ClinicStatus.GENERATED,
    total_reviews: 25,
    average_rating: 4.7,
    lead_score: 91,
    notes: "New lead, no contact made yet.",
    emails_for_outreach: defaultEmails("Clinic Alpha"),
    campaign_batch: "test batch",
    phone: "1234567890",
  },
  {
    id: 2,
    name: "Aganon's Clinic",
    email: "info@mock.com",
    website_url: "https://clinicalpha.com",
    top_features: "Advanced equipment, Certified specialists",
    type: ["Spa"],
    city: "Toronto",
    province: "Ontario",
    email_status: ClinicStatus.EXPORTED,
    total_reviews: 25,
    average_rating: 4.7,
    lead_score: 91,
    notes: "New lead, no contact made yet.",
    emails_for_outreach: defaultEmails("Clinic Alpha"),
    campaign_batch: "test batch",
    phone: "1234567890",
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
    key: "email_status",
    label: "email_status",
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
    desc_value: 52,
  },
  {
    label: "Emails Sent Today",
    value: 10,
    desc: "Daily limit reached",
  },
  {
    label: "Active Campaigns",
    value: 127,
    desc: "reply rate",
    desc_value: 0.23,
  },
  {
    label: "Replied Received",
    value: 29,
    desc: "this week",
    desc_value: -12,
  },
];

export const mockCampaignStatus: CampaignStatus = {
  prompt: defaultPrompt,
  total_clinics: 592,
  max_word_limit: 120,
  number_of_clinics: 89,
};

export const mockDashboardResponse: DashboardResponse = {
  clinics_data: mockClinicsData,
  metrics: mockMetrics,
  filters: mockFilters,
  campaign_status: mockCampaignStatus,
  show_export: true,
  total_clinics: 500,
  filtered_clinics_count: 200,
  not_generated_emails_count: 120,
};
