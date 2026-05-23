"use client";

import {
  createContext,
  useContext,
  useEffect,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { PUBLIC_ROUTES } from "@/lib/constants";
import { CampaignStatus, Filter, FilterState, Clinic, Metric } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDashboard,
  loadPageFromCache,
  resetDashboard,
  selectDashboard,
  setCampaignStatus,
  setFilters as setFiltersAction,
  setLoading as setLoadingAction,
  setPage as setPageAction,
  setWsClinicsGenerated as setWsClinicsGeneratedAction,
} from "@/store/dashboardSlice";

interface DashboardContextProps {
  clinics: Clinic[];
  filters: FilterState;
  setFilters: (updater: ((prev: FilterState) => FilterState) | FilterState) => void;
  filtersConfig: Filter[];
  loading: boolean;
  loadingPage: boolean;
  error: string | null;
  campaignStatus: CampaignStatus;
  setCampaignStatus: (updater: ((prev: CampaignStatus) => CampaignStatus) | CampaignStatus) => void;
  metrics: Metric[];
  showExport: boolean;
  page: number;
  limit: number;
  total: number;
  filteredCount: number;
  totalPages: number;
  notGeneratedEmailsCount: number;
  sentCount: number;
  repliedCount: number;
  wsClinicsGenerated: number;
  setWsClinicsGenerated: Dispatch<SetStateAction<number>>;
  setPage: (p: number) => void;
  setLoading: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectDashboard);
  const pathname = usePathname();

  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) return;
    const key = JSON.stringify({ page: state.page, filters: state.filters });
    if (key in state.pageCache) {
      dispatch(loadPageFromCache(key));
    } else {
      dispatch(fetchDashboard({ page: state.page, limit: state.limit, filters: state.filters }));
    }
  }, [state.page, state.filters, pathname]);

  // Reset dashboard state when user lands on a public route (e.g. after logout)
  useEffect(() => {
    if (PUBLIC_ROUTES.includes(pathname)) {
      dispatch(resetDashboard());
    }
  }, [pathname]);

  const value: DashboardContextProps = {
    clinics: state.clinics,
    filters: state.filters,
    setFilters: (updater) => {
      const next = typeof updater === "function" ? updater(state.filters) : updater;
      dispatch(setFiltersAction(next));
    },
    filtersConfig: state.filtersConfig,
    loading: state.loading,
    loadingPage: state.loadingPage,
    error: state.error,
    campaignStatus: state.campaignStatus,
    setCampaignStatus: (updater) => {
      const next = typeof updater === "function" ? updater(state.campaignStatus) : updater;
      dispatch(setCampaignStatus(next));
    },
    metrics: state.metrics,
    showExport: state.showExport,
    page: state.page,
    limit: state.limit,
    total: state.total,
    filteredCount: state.filteredCount,
    totalPages: Math.ceil(state.filteredCount / state.limit),
    notGeneratedEmailsCount: state.notGeneratedEmailsCount,
    sentCount: state.sentCount,
    repliedCount: state.repliedCount,
    wsClinicsGenerated: state.wsClinicsGenerated,
    setWsClinicsGenerated: (updater) => {
      const next = typeof updater === "function" ? updater(state.wsClinicsGenerated) : updater;
      dispatch(setWsClinicsGeneratedAction(next));
    },
    setPage: (p) => dispatch(setPageAction(p)),
    setLoading: (value) => {
      const next = typeof value === "function" ? value(state.loading) : value;
      dispatch(setLoadingAction(next));
    },
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboardContext must be used within DashboardProvider");
  return context;
}
