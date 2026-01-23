"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import { useExportSmartlead } from "@/hooks/useExportSmartlead";
import EmergencyIcon from "@mui/icons-material/Emergency";

import FilterUI from "./FilterUI";
import SelectedFilters from "./SelectedFilters";
import { FilterState } from "@/lib/types";

export default function ClinicsFilters() {
  const { filters, setFilters, filtersConfig, showExport } =
    useDashboardContext();
  const { exportCSV, loading } = useExportSmartlead();

  if (!showExport) return;

  const hasCampaignBatch =
    Array.isArray(filters["campaign_batch"]) &&
    filters["campaign_batch"].length > 0;

  const handleChange = (
    key: string,
    value: string,
    type: "select" | "sort",
  ) => {
    setFilters((prev: FilterState) => {
      if (type === "sort") return { ...prev, [key]: [value] };

      const exists = (prev[key] || []).includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== value)
          : [...(prev[key] || []), value],
      };
    });
  };

  const removeFilter = (key: string, value: string) => {
    setFilters((prev: FilterState) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
  };

  const clearAllFilters = () => {
    setFilters(
      filtersConfig.reduce<FilterState>((acc, f) => {
        acc[f.key] = [];
        return acc;
      }, {}),
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-8 h-18 w-full bg-gray-50 p-2! px-8! shadow-sm border border-gray-200">
        <div className="flex items-center gap-6">
          {filtersConfig.map((filter) => (
            <FilterUI
              key={filter.key}
              label={filter.label}
              values={filter.values}
              type={filter.type}
              selected={filters[filter.key]}
              onChange={(value) => handleChange(filter.key, value, filter.type)}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="flex gap-0.5 mt-3 text-xs font-semibold text-gray-400">
            <EmergencyIcon className="text-[10px]! mt-0.5" />
            Select a Campaign Batch ID to export to Smartlead:
          </span>
          {showExport && (
            <button
              onClick={exportCSV}
              disabled={loading || !hasCampaignBatch}
              className={`mt-3 font-semibold text-sm bg-amber-500 text-white px-2 py-1.5 rounded hover:bg-amber-600 cursor-pointer transition-all duration-200 
               ${
                 loading || !hasCampaignBatch
                   ? "opacity-50 cursor-not-allowed! hover:bg-amber-500!"
                   : "hover:bg-amber-600 cursor-pointer"
               }
              
              `}
            >
              {!hasCampaignBatch
                ? "Choose batch id to enable export"
                : loading
                  ? "Loading..."
                  : "Export Smartlead CSV"}
            </button>
          )}
        </div>
      </div>

      <SelectedFilters
        filters={filters}
        filterConfigs={filtersConfig}
        onRemove={removeFilter}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
