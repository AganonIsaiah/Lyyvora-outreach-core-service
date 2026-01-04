"use client";

import { useState } from "react";
import { ClinicStatus, Clinic, FilterState } from "@/lib/types";
import { mockFilters } from "@/mock/dashboard-data";

import FilterUI from "./FilterUI";
import SelectedFilters from "./SelectedFilters";

interface ClinicsFiltersProps {
  clinics: Clinic[];
  // onFilter: (filteredClinics: Clinic[]) => void;
}

/**
 * Filter multi-select
 * - Name
 * - Type
 * - City
 * - Province
 * - Status
 *
 * Filter sorting asc/desc
 * - Lead Score
 * - Average Rating
 * - Last Contact Date
 * - Next Contact Date
 */
export default function ClinicsFilters({ clinics }: ClinicsFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(
    mockFilters.reduce((acc, f) => {
      acc[f.key] = [];
      return acc;
    }, {} as FilterState)
  );

  const handleChange = (
    key: string,
    value: string,
    type: "select" | "sort"
  ) => {
    setFilters((prev) => {
      if (type === "sort") {
        return { ...prev, [key]: [value] };
      }

      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((v) => v !== value)
          : [...prev[key], value],
      };
    });
  };

  const removeFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].filter((v) => v !== value),
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="w-full bg-gray-50 p-3! rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-5 gap-y-2 place-items-center">
          {mockFilters.map((filter) => (
            <FilterUI
              key={filter.key}
              label={filter.label}
              values={filter.values}
              type={filter.type}
              selected={filters[filter.key]}
              onChange={(value) => handleChange(filter.key, value, filter.type)}
            />
          ))}
          <div className="flex gap-2 mt-4 text-sm">
            <button className="w-26 bg-blue-500 text-white px-2 py-1 rounded font-semibold cursor-pointer hover:bg-blue-600 transition-all duration-200">
              Apply Filters
            </button>
            <button className="h-7 w-22 whitespace-nowrap cursor-pointer bg-gray-400 px-2 py-1 rounded-md font-semibold text-white hover:bg-gray-500 transition-all duration-200">
              Clear All
            </button>
          </div>
        </div>
      </div>

      <SelectedFilters
        filters={filters}
        filterConfigs={mockFilters}
        onRemove={removeFilter}
      />
    </div>
  );
}
