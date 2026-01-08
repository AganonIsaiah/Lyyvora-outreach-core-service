import { DashboardResponse, Clinic } from "@/lib/types";
import { mockDashboardResponse } from "@/mock/dashboard-data";

const MOCK_DATA = false;
const BASE_URL = "http://localhost:8000";

export const dashboardService = {

  async fetchDashboardData(): Promise<DashboardResponse> {
    if (MOCK_DATA) return mockDashboardResponse;

    const res = await fetch (`${BASE_URL}/dashboard`);
    if (!res.ok) throw new Error("Failed to fetch dashboard data");
    return res.json();
  }
};