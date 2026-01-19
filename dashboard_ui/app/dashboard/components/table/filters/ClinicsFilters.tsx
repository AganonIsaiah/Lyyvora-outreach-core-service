"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import FilterUI from "./FilterUI";
import SelectedFilters from "./SelectedFilters";
import { FilterState } from "@/lib/types";

export default function ClinicsFilters() {
  const { filters, setFilters, filtersConfig, showExport } = useDashboardContext();

  if (!showExport) return;

  const handleChange = (
    key: string,
    value: string,
    type: "select" | "sort"
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
      }, {})
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-evenly gap-2 h-18 w-full bg-gray-50 p-2! shadow-sm border border-gray-200">
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

      <SelectedFilters
        filters={filters}
        filterConfigs={filtersConfig}
        onRemove={removeFilter}
        onClearAll={clearAllFilters}
      />
    </div>
  );
}
