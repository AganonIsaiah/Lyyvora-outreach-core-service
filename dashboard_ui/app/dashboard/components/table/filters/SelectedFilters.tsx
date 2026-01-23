"use client";

import { Filter } from "@/lib/types";

interface SelectedFiltersProps {
  filters: Record<string, string[]>;
  filterConfigs: Filter[];
  onRemove: (key: string, value: string) => void;
  onClearAll: () => void;
}

export default function SelectedFilters({
  filters,
  filterConfigs,
  onRemove,
  onClearAll
}: SelectedFiltersProps) {

  const activeFilters = Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => ({ key, value }))
  );

  const getLabel = (key: string) =>
    filterConfigs.find((f) => f.key === key)?.label ?? key;

  return (
    <div className="flex justify-between bg-white px-6 py-3 w-full min-h-13.5 border border-gray-200 shadow-sm">
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {activeFilters.map(({ key, value }) => (
            <div
              key={`${key}-${value}`}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded-full"
            >
              <span>
                <strong>{getLabel(key)}:</strong> {value}
              </span>
              <button
                onClick={() => onRemove(key, value)}
                className="ml-1 text-blue-500 hover:text-blue-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center text-gray-500 text-sm">
          No filters selected...
        </div>
      )}
      <button 
      onClick={onClearAll}
      className="h-7 w-22 whitespace-nowrap cursor-pointer bg-gray-400 px-2 py-1 rounded-md font-semibold text-white hover:bg-gray-500 transition-all duration-200">
        Clear All
      </button>
    </div>
  );
}
