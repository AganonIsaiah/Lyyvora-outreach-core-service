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
  filteredClinics: Clinic[];
  filters: FilterState;
  setFilters: (
    updater: ((prev: FilterState) => FilterState) | FilterState
  ) => void;
  filtersConfig: Filter[];
  loading: boolean;
  error: string | null;
  campaignStatus: CampaignStatus;
  setCampaignStatus: (
    updater: ((prev: CampaignStatus) => CampaignStatus) | CampaignStatus
  ) => void;
  metrics: Metric[];
}

const DashboardContext = createContext<DashboardContextProps | undefined>(
  undefined
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [filtersConfig, setFiltersConfig] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>(
    {} as CampaignStatus
  );
  const [metrics, setMetrics] = useState<Metric[]>([]); 

  useEffect(() => {
    dashboardService
      .fetchDashboardData()
      .then((data: DashboardResponse) => {
        setClinics(data.clinics_data);
        setFilteredClinics(data.clinics_data);
        setFiltersConfig(data.filters);
        setCampaignStatus(data.campaign_status);
        setMetrics(data.metrics); 

        const initialFilters: FilterState = {};
        data.filters.forEach((f) => {
          initialFilters[f.key] = [];
        });
        setFilters(initialFilters);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (clinics.length === 0) return;

    let result = [...clinics];

    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        const filterValues = values.filter(
          (v) => v !== "Asc" && v !== "Desc" && v !== "None"
        );
        if (filterValues.length > 0) {
          result = result.filter((clinic) => {
            const clinicValue = (clinic as any)[key];
            if (Array.isArray(clinicValue)) {
              return filterValues.some((v) => clinicValue.includes(v));
            }
            return filterValues.includes(clinicValue);
          });
        }
      }
    });

    const sortKeys: (keyof FilterState)[] = [
      "lead_score",
      "average_rating",
      "last_contact_date",
      "next_contact_date",
    ];

    sortKeys.forEach((key) => {
      const sortValue = filters[key]?.[0];
      if (sortValue && sortValue !== "None") {
        result.sort((a: any, b: any) => {
          let aVal = a[key];
          let bVal = b[key];

          if (key.includes("date")) {
            aVal = aVal ? new Date(aVal).getTime() : 0;
            bVal = bVal ? new Date(bVal).getTime() : 0;
          }

          if (aVal < bVal) return sortValue === "Asc" ? -1 : 1;
          if (aVal > bVal) return sortValue === "Asc" ? 1 : -1;
          return 0;
        });
      }
    });

    setFilteredClinics(result);
  }, [filters, clinics]);

  return (
    <DashboardContext.Provider
      value={{
        clinics,
        filteredClinics,
        filters,
        setFilters,
        filtersConfig,
        loading,
        error,
        campaignStatus,
        setCampaignStatus,
        metrics
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
