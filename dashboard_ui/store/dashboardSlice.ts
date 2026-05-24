import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Clinic,
  ClinicEmails,
  ClinicStatus,
  CampaignStatus,
  Filter,
  FilterState,
  Metric,
  DashboardResponse,
} from "@/lib/types";
import { dashboardService } from "@/services/dashboardService";
import type { RootState } from "./store";

const EMAIL_STATUS_PRIORITY: Record<string, number> = {
  [ClinicStatus.REPLIED]: 4,
  [ClinicStatus.EXPORTED]: 3,
  [ClinicStatus.GENERATED]: 2,
  [ClinicStatus.NOT_GENERATED]: 1,
  [ClinicStatus.NO_RESPONSE]: 0
};

function sortClinics(clinics: Clinic[]): Clinic[] {
  return [...clinics].sort((a, b) => {
    const priorityDiff =
      (EMAIL_STATUS_PRIORITY[b.email_status] ?? 0) -
      (EMAIL_STATUS_PRIORITY[a.email_status] ?? 0);
    if (priorityDiff !== 0) return priorityDiff;
    return (b.lead_score ?? 0) - (a.lead_score ?? 0);
  });
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const BACKEND_BATCH_SIZE = 1000;

interface DashboardState {
  clinics: Clinic[];
  allClinics: Clinic[];
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
  backendPage: number;
  total: number;
  filteredCount: number;
  notGeneratedEmailsCount: number;
  sentCount: number;
  repliedCount: number;
  noResponseCount: number;
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
  allClinics: [],
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
  backendPage: 1,
  total: 0,
  filteredCount: 0,
  notGeneratedEmailsCount: 0,
  sentCount: 0,
  repliedCount: 0,
  noResponseCount: 0,
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
  { filters: FilterState; backendPage?: number; targetPage?: number },
  { state: RootState }
>(
  "dashboard/fetch",
  async ({ filters, backendPage = 1 }) => {
    return dashboardService.fetchDashboardData(filters, backendPage, BACKEND_BATCH_SIZE);
  },
  {
    condition: ({ filters, backendPage = 1 }, { getState }) => {
      const { dashboard } = getState();
      const key = JSON.stringify({ filters, backendPage });
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
      const pagesPerBatch = BACKEND_BATCH_SIZE / state.limit;
      const withinBatchPage = ((action.payload - 1) % pagesPerBatch) + 1;
      const start = (withinBatchPage - 1) * state.limit;
      state.clinics = state.allClinics.slice(start, start + state.limit);
    },
    setFilters(state, action: PayloadAction<FilterState>) {
      state.filters = action.payload;
      state.page = 1;
      state.backendPage = 1;
      state.allClinics = [];
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
    loadPageFromCache(state, action: PayloadAction<{ key: string; targetPage: number; backendPage: number }>) {
      const { key, targetPage, backendPage } = action.payload;
      const cached = state.pageCache[key];
      if (!cached) return;
      const all = cached.clinics_data as Clinic[];
      state.allClinics = all;
      state.backendPage = backendPage;
      state.page = targetPage;
      const pagesPerBatch = BACKEND_BATCH_SIZE / state.limit;
      const withinBatchPage = ((targetPage - 1) % pagesPerBatch) + 1;
      const start = (withinBatchPage - 1) * state.limit;
      state.clinics = all.slice(start, start + state.limit);
      state.filtersConfig = cached.filters;
      state.campaignStatus = cached.campaign_status;
      state.metrics = cached.metrics;
      state.showExport = cached.show_export;
      state.notGeneratedEmailsCount = cached.not_generated_emails_count;
      state.sentCount = cached.sent_count;
      state.repliedCount = cached.replied_count;
      state.noResponseCount = cached.no_response_count;
      state.total = cached.total_clinics;
      state.filteredCount = cached.filtered_clinics_count;
      state.loading = false;
      state.loadingPage = false;
      state.error = null;
    },
    clearPageCache(state) {
      state.pageCache = {};
    },
    evictClinicDetail(state, action: PayloadAction<string>) {
      delete state.clinicDetails[action.payload];
      delete state.clinicEmails[action.payload];
    },
    markBatchAsExported(state, action: PayloadAction<string>) {
      const batch = action.payload;
      const updatedAll = sortClinics(
        state.allClinics.map((c) =>
          c.campaign_batch === batch ? { ...c, email_status: ClinicStatus.EXPORTED } : c
        )
      );
      state.allClinics = updatedAll;
      const pagesPerBatch = BACKEND_BATCH_SIZE / state.limit;
      const withinBatchPage = ((state.page - 1) % pagesPerBatch) + 1;
      const start = (withinBatchPage - 1) * state.limit;
      state.clinics = updatedAll.slice(start, start + state.limit);
      state.pageCache = {};
    },
    resetDashboard() {
      return { ...initialState, loadingPage: false };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.loading = true;
        const { filters, backendPage = 1 } = action.meta.arg;
        if (state.lastFetchKey === "") state.loadingPage = true;
        state.lastFetchKey = JSON.stringify({ filters, backendPage });
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        const data = action.payload;
        const { filters, backendPage = 1, targetPage } = action.meta.arg;
        const sortedClinics = sortClinics(data.clinics_data);
        state.allClinics = sortedClinics;
        state.backendPage = backendPage;

        const pagesPerBatch = BACKEND_BATCH_SIZE / state.limit;
        const newPage = targetPage ?? (backendPage - 1) * pagesPerBatch + 1;
        const withinBatchPage = ((newPage - 1) % pagesPerBatch) + 1;
        const start = (withinBatchPage - 1) * state.limit;

        state.page = newPage;
        state.clinics = sortedClinics.slice(start, start + state.limit);
        state.filtersConfig = data.filters;
        state.campaignStatus = data.campaign_status;
        state.metrics = data.metrics;
        state.showExport = data.show_export;
        state.notGeneratedEmailsCount = data.not_generated_emails_count;
        state.sentCount = data.sent_count;
        state.repliedCount = data.replied_count;
        state.noResponseCount = data.no_response_count;
        state.total = data.total_clinics;
        state.filteredCount = data.filtered_clinics_count;
        state.loading = false;
        state.loadingPage = false;
        state.error = null;
        state.pageCache[JSON.stringify({ filters, backendPage })] = { ...data, clinics_data: sortedClinics };
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
  clearPageCache,
  evictClinicDetail,
  markBatchAsExported,
  resetDashboard,
} = dashboardSlice.actions;

export const selectDashboard = (state: RootState) => state.dashboard;
export const selectClinicDetail = (clinicId: string) => (state: RootState) =>
  state.dashboard.clinicDetails[clinicId] ?? null;
export const selectClinicEmails = (clinicId: string) => (state: RootState) =>
  state.dashboard.clinicEmails[clinicId] ?? null;

export default dashboardSlice.reducer;
