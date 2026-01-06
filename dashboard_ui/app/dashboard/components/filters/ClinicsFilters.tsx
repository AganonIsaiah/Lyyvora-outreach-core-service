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
    <div className="flex flex-col">
      <div className="flex items-center justify-evenly gap-2 h-21 w-full bg-gray-50 p-2! shadow-sm border border-gray-200">
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

      </div>

      <SelectedFilters
        filters={filters}
        filterConfigs={mockFilters}
        onRemove={removeFilter}
      />
    </div>
  );
}
