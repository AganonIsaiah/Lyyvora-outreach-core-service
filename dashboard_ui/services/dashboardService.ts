import { DashboardResponse, FilterState } from "@/lib/types";
import { mockDashboardResponse } from "@/mock/dashboard-data";

const MOCK_DATA = false;
const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export const dashboardService = {
  async fetchDashboardData(
    filters?: FilterState
  ): Promise<DashboardResponse> {
    if (MOCK_DATA) return mockDashboardResponse;

    const params = new URLSearchParams();

    if (filters) {
      if (filters.name?.length)
        filters.name.forEach((v) => params.append("name", v));

      if (filters.type?.length)
        filters.type.forEach((v) => params.append("sub_type", v));

      if (filters.city?.length)
        filters.city.forEach((v) => params.append("city", v));

      if (filters.province?.length)
        filters.province.forEach((v) => params.append("province", v));

      if (filters.email_status?.length)
        filters.email_status.forEach((v) => params.append("email_status", v));

      if (filters.campaign_batch?.length)
        filters.campaign_batch.forEach((v) =>
          params.append("campaign_batch", v)
        );

    }

    const res = await fetch(`${BASE_URL}/dashboard?${params.toString()}`, {
      credentials: "include", 
    });

    if (res.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(new Error("Not authenticated"));
    }
    
    if (!res.ok) {
      return {
        clinics_data: [],
        filters: [],
        campaign_status: {} as any,
        metrics: [],
        show_export: false,
        total_clinics: 0,
        filtered_clinics_count: 0,
        not_generated_emails_count: 0,
        sent_count: 0,
        replied_count: 0,
        no_response_count: 0,
      };
    }

    const data: DashboardResponse = await res.json();

    return {
      clinics_data: data.clinics_data || [],
      filters: data.filters || [],
      campaign_status: data.campaign_status || {},
      metrics: data.metrics || [],
      show_export: data.show_export ?? false,
      total_clinics: data.total_clinics ?? 0,
      filtered_clinics_count: data.filtered_clinics_count ?? 0,
      not_generated_emails_count: data.not_generated_emails_count ?? 0,
      sent_count: data.sent_count ?? 0,
      replied_count: data.replied_count ?? 0,
      no_response_count: data.no_response_count ?? 0,
    };
  },
};
