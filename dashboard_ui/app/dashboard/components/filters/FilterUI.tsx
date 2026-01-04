"use client";

import { useEffect, useState } from "react";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface FilterUIProps {
  label: string;
  values: string[];
  selected: string | null;
  onChange: (value: string | null) => void;
}

export default function FilterUI({
  label,
  values,
  selected,
  onChange,
}: FilterUIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredValues, setFilteredValues] = useState<string[]>(values);

  useEffect(() => {
    setFilteredValues(
      values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, values]);

  return (
    <div>
      <button
        className="w-30! flex items-center justify-between gap-1 bg-white! border border-gray-200 rounded-md px-2 py-1! cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <p>{label}</p>
        <span>
          {isOpen ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-30 bg-white border border-gray-400 rounded shadow-lg">

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white top-0 sticky z-30 w-full px-2 py-1 border-b border-gray-400 focus:outline-none"
          />

          <ul className="overflow-auto max-h-40!">
            {filteredValues.length > 0 ? (
              filteredValues.map((v) => (
                <li
                  key={v}
                  className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    onChange(v);
                    setIsOpen(false);
                    setSearch(""); 
                  }}
                >
                  {v}
                </li>
              ))
            ) : (
              <li className="px-3 py-1 text-gray-400">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
