"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  DashboardResponse,
  Clinic,
  FilterState,
  Filter,
  CampaignStatus,
  Metric,
} from "@/lib/types";
import { dashboardService } from "@/services/dashboardService";

interface DashboardContextProps {
  clinics: Clinic[];
  filters: FilterState;
  setFilters: (
    updater: ((prev: FilterState) => FilterState) | FilterState
  ) => void;
  filtersConfig: Filter[];
  loading: boolean;
  loadingPage: boolean;
  error: string | null;
  campaignStatus: CampaignStatus;
  setCampaignStatus: (
    updater: ((prev: CampaignStatus) => CampaignStatus) | CampaignStatus
  ) => void;
  metrics: Metric[];
  showExport: boolean;
  page: number;
  limit: number;
  total: number;
  filteredCount: number;
  totalPages: number;
  notGeneratedEmailsCount: number;
  setPage: (p: number) => void;
  setLoading: (value: boolean | ((prev: boolean) => boolean)) => void;
}

const DashboardContext = createContext<DashboardContextProps | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [filtersConfig, setFiltersConfig] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>(
    {} as CampaignStatus
  );
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [notGeneratedEmailsCount, setNotGeneratedEmailsCount] = useState(0);

  useEffect(() => {
    setLoading(true);

    dashboardService
      .fetchDashboardData(page, limit, filters)
      .then((data: DashboardResponse) => {
        setClinics(data.clinics_data);
        setFiltersConfig(data.filters);
        setCampaignStatus(data.campaign_status);
        setMetrics(data.metrics);
        setShowExport(data.show_export);
        setNotGeneratedEmailsCount(data.not_generated_emails_count);
        setTotal(data.total_clinics);
        setFilteredCount(data.filtered_clinics_count);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => {
        setLoading(false);
        setLoadingPage(false); 
      });
  }, [page, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <DashboardContext.Provider
      value={{
        clinics,
        filters,
        setFilters,
        filtersConfig,
        loading,
        setLoading,
        loadingPage,
        error,
        campaignStatus,
        setCampaignStatus,
        metrics,
        page,
        limit,
        total,
        filteredCount,
        totalPages: Math.ceil(filteredCount / limit),
        setPage,
        showExport,
        notGeneratedEmailsCount,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext must be used within DashboardProvider"
    );
  return context;
}
