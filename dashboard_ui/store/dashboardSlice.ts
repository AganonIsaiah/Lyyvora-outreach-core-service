import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Clinic,
  ClinicEmails,
  CampaignStatus,
  Filter,
  FilterState,
  Metric,
  DashboardResponse,
} from "@/lib/types";
import { dashboardService } from "@/services/dashboardService";
import type { RootState } from "./store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface DashboardState {
  clinics: Clinic[];
  filters: FilterState;
  filtersConfig: Filter[];
  loading: boolean;
  loadingPage: boolean;
  error: string | null;
  campaignStatus: CampaignStatus;
  metrics: Metric[];
  showExport: boolean;
  page: number;
  limit: number;
  total: number;
  filteredCount: number;
  notGeneratedEmailsCount: number;
  sentCount: number;
  repliedCount: number;
  wsClinicsGenerated: number;
  lastFetchKey: string;
  pageCache: Record<string, DashboardResponse>;
  clinicDetails: Record<string, Clinic>;
  clinicEmails: Record<string, ClinicEmails[]>;
  pendingClinicIds: string[];
  clinicDetailLoading: boolean;
  clinicDetailError: string | null;
}

const initialState: DashboardState = {
  clinics: [],
  filters: {},
  filtersConfig: [],
  loading: false,
  loadingPage: true,
  error: null,
  campaignStatus: {} as CampaignStatus,
  metrics: [],
  showExport: false,
  page: 1,
  limit: 100,
  total: 0,
  filteredCount: 0,
  notGeneratedEmailsCount: 0,
  sentCount: 0,
  repliedCount: 0,
  wsClinicsGenerated: 0,
  lastFetchKey: "",
  pageCache: {},
  clinicDetails: {},
  clinicEmails: {},
  pendingClinicIds: [],
  clinicDetailLoading: false,
  clinicDetailError: null,
};

export const fetchDashboard = createAsyncThunk<
  DashboardResponse,
  { page: number; limit: number; filters: FilterState },
  { state: RootState }
>(
  "dashboard/fetch",
  async ({ page, limit, filters }) => {
    return dashboardService.fetchDashboardData(page, limit, filters);
  },
  {
    condition: ({ page, filters }, { getState }) => {
      const { dashboard } = getState();
      const key = JSON.stringify({ page, filters });
      // Skip if already cached or an in-flight request for this key is running
      if (key in dashboard.pageCache) return false;
      return !(dashboard.lastFetchKey === key && dashboard.loading);
    },
  }
);

export const fetchClinicDetail = createAsyncThunk<
  { clinic: Clinic; emails: ClinicEmails[] } | null,
  string,
  { state: RootState }
>(
  "dashboard/fetchClinicDetail",
  async (clinicId) => {
    const res = await fetch(`${BASE_URL}/clinics/${clinicId}`, {
      credentials: "include",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch clinic");
    const data = await res.json();
    return { clinic: data, emails: data.emails_for_outreach ?? [] };
  },
  {
    condition: (clinicId, { getState }) => {
      const { clinicDetails, pendingClinicIds } = getState().dashboard;
      // Skip if already cached OR if a fetch for this clinic is already in-flight
      return !(clinicId in clinicDetails) && !pendingClinicIds.includes(clinicId);
    },
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setFilters(state, action: PayloadAction<FilterState>) {
      state.filters = action.payload;
      state.page = 1;
      state.pageCache = {};
    },
    setCampaignStatus(state, action: PayloadAction<CampaignStatus>) {
      state.campaignStatus = action.payload;
    },
    setWsClinicsGenerated(state, action: PayloadAction<number>) {
      state.wsClinicsGenerated = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    loadPageFromCache(state, action: PayloadAction<string>) {
      const cached = state.pageCache[action.payload];
      if (!cached) return;
      state.clinics = cached.clinics_data;
      state.filtersConfig = cached.filters;
      state.campaignStatus = cached.campaign_status;
      state.metrics = cached.metrics;
      state.showExport = cached.show_export;
      state.notGeneratedEmailsCount = cached.not_generated_emails_count;
      state.sentCount = cached.sent_count;
      state.repliedCount = cached.replied_count;
      state.total = cached.total_clinics;
      state.filteredCount = cached.filtered_clinics_count;
      state.loading = false;
      state.loadingPage = false;
      state.error = null;
    },
    resetDashboard() {
      return { ...initialState, loadingPage: false };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.loading = true;
        const { page, filters } = action.meta.arg;
        if (state.lastFetchKey === "") state.loadingPage = true;
        state.lastFetchKey = JSON.stringify({ page, filters });
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        const data = action.payload;
        const { page, filters } = action.meta.arg;
        state.clinics = data.clinics_data;
        state.filtersConfig = data.filters;
        state.campaignStatus = data.campaign_status;
        state.metrics = data.metrics;
        state.showExport = data.show_export;
        state.notGeneratedEmailsCount = data.not_generated_emails_count;
        state.sentCount = data.sent_count;
        state.repliedCount = data.replied_count;
        state.total = data.total_clinics;
        state.filteredCount = data.filtered_clinics_count;
        state.loading = false;
        state.loadingPage = false;
        state.error = null;
        // Cache the response so revisiting this page is instant
        state.pageCache[JSON.stringify({ page, filters })] = data;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.error = action.error.message ?? "Unknown error";
        state.loading = false;
        state.loadingPage = false;
      })
      .addCase(fetchClinicDetail.pending, (state, action) => {
        state.clinicDetailLoading = true;
        state.clinicDetailError = null;
        // Track in-flight IDs so a second dispatch with the same ID is skipped
        state.pendingClinicIds.push(action.meta.arg);
      })
      .addCase(fetchClinicDetail.fulfilled, (state, action) => {
        state.clinicDetailLoading = false;
        state.pendingClinicIds = state.pendingClinicIds.filter(
          (id) => id !== action.meta.arg
        );
        if (!action.payload) return;
        const { clinic, emails } = action.payload;
        const key = String(clinic.id);
        // Evict oldest entry if cache exceeds limit (LRU-style cap)
        const MAX_CACHE = 100;
        const keys = Object.keys(state.clinicDetails);
        if (keys.length >= MAX_CACHE) {
          delete state.clinicDetails[keys[0]];
          delete state.clinicEmails[keys[0]];
        }
        state.clinicDetails[key] = clinic;
        state.clinicEmails[key] = emails;
      })
      .addCase(fetchClinicDetail.rejected, (state, action) => {
        state.clinicDetailLoading = false;
        state.clinicDetailError = action.error.message ?? "Failed to fetch clinic";
        state.pendingClinicIds = state.pendingClinicIds.filter(
          (id) => id !== action.meta.arg
        );
      });
  },
});

export const {
  setPage,
  setFilters,
  setCampaignStatus,
  setWsClinicsGenerated,
  setLoading,
  loadPageFromCache,
  resetDashboard,
} = dashboardSlice.actions;

export const selectDashboard = (state: RootState) => state.dashboard;
export const selectClinicDetail = (clinicId: string) => (state: RootState) =>
  state.dashboard.clinicDetails[clinicId] ?? null;
export const selectClinicEmails = (clinicId: string) => (state: RootState) =>
  state.dashboard.clinicEmails[clinicId] ?? null;

export default dashboardSlice.reducer;
