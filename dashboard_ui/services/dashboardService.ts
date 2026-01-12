import { DashboardResponse, FilterState } from "@/lib/types";
import { mockDashboardResponse } from "@/mock/dashboard-data";

const MOCK_DATA = false;
const BASE_URL = "http://localhost:8000";

export const dashboardService = {
  async fetchDashboardData(
    page: number = 1,
    limit: number = 25,
    filters?: FilterState
  ): Promise<DashboardResponse> {
    if (MOCK_DATA) return mockDashboardResponse;

    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

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
        filters.campaign_batch.forEach((v) => params.append("campaign_batch", v));

      if (filters.lead_score?.length) {
        params.append("sort_by", "lead_score");
        params.append("sort_order", filters.lead_score[0].toLowerCase());
      }

      if (filters.average_rating?.length) {
        params.append("sort_by", "average_rating");
        params.append("sort_order", filters.average_rating[0].toLowerCase());
      }
    }

    const res = await fetch(`${BASE_URL}/dashboard?${params.toString()}`);
    if (!res.ok) {
      return {
        clinics_data: [],
        filters: [],
        campaign_status: {} as any,
        metrics: [],
        show_export: false,
        total_clinics: 0,
        filtered_clinics_count: 0
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
      filtered_clinics_count: data.filtered_clinics_count ?? 0
    };
  },
};
