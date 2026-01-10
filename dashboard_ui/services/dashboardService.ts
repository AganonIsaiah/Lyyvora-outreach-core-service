import { DashboardResponse, FilterState } from "@/lib/types";
import { mockDashboardResponse } from "@/mock/dashboard-data";

const MOCK_DATA = true;
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

      if (filters.sub_type?.length) 
        filters.sub_type.forEach((v) => params.append("sub_type", v));

      console.log("filters sub: ", params)

      if (filters.city?.length)
        filters.city.forEach((v) => params.append("city", v));

      if (filters.province?.length)
        filters.province.forEach((v) => params.append("province", v));

      if (filters.status?.length)
        filters.status.forEach((v) => params.append("status", v));

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
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  },
};
