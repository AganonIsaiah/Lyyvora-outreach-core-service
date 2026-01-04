"use client";

import { useState } from "react";
import { ClinicStatus, Clinic } from "@/lib/types";

import FilterUI from "./FilterUI";

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
  const cityOptions = ["Toronto", "Ottawa", "Vancouver", "Calgary", "Montreal"];
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  return (
    <div className="w-full! bg-gray-50 p-3! rounded-lg shadow-sm border border-gray-200">
      <FilterUI
        label="City"
        values={cityOptions}
        selected={selectedCity}
        onChange={setSelectedCity}
      />
    </div>
  );
}
