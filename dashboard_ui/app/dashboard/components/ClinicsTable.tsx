"use client";

import { useRouter } from "next/navigation";
import { useDashboardContext } from "@/context/DashboardContext";

import { CLINIC_STATUS_COLOR } from "@/lib/constants";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

export default function ClinicsTable() {
  const router = useRouter();
  const { clinics, filteredClinics } = useDashboardContext();

  const isDashboardEmpty = clinics.length === 0;

  return (
    <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-y-auto overflow-x-hidden h-[calc(100vh-43vh)] min-h-40">
      {filteredClinics.length === 0 ? (
        <div className="p-4 font-semibold text-gray-500 text-sm flex flex-col gap-2">
          {isDashboardEmpty
            ? "Dashboard is empty, click the import CSV button to populate the table."
            : "No clinics match the selected filters. Try changing your filter options."}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Lead Score</th>
              <th>Type</th>
              <th>City</th>
              <th>Province</th>
              <th>Status</th>
              <th>Average Rating</th>
              <th className="min-w-35">Last Contact Date</th>
              <th className="min-w-35">Next Contact Date</th>
              <th>Notes</th>
              <th>Expand</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.map((c) => (
              <tr key={c.id} className="border-b border-gray-200 h-12">
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.lead_score}</td>
                <td>{c.type.join(", ")}</td>
                <td>{c.city}</td>
                <td>{c.province}</td>
                <td>
                  <span
                    className={`whitespace-nowrap font-semibold px-2 py-1 rounded-xl text-xs ${
                      CLINIC_STATUS_COLOR[c.status]
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td>{c.average_rating}</td>
                <td>
                  {c.last_contact_date ? (
                    <p>{c.last_contact_date}</p>
                  ) : (
                    <HorizontalRuleIcon className="text-gray-500 text-sm" />
                  )}
                </td>
                <td>
                  {c.next_contact_date ? (
                    <p>{c.next_contact_date}</p>
                  ) : (
                    <HorizontalRuleIcon className="text-gray-500 text-sm" />
                  )}
                </td>
                <td>
                  {c.notes ? (
                    <p className="truncate max-w-30">{c.notes}</p>
                  ) : (
                    <HorizontalRuleIcon className="text-gray-500 text-sm" />
                  )}
                </td>
                <td>
                  <button
                    onClick={() => router.push(`/clinics/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <ZoomOutMapIcon
                      fontSize="small"
                      className="text-gray-500 hover:text-black"
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
