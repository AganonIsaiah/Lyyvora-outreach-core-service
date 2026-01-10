"use client";

import { useRouter } from "next/navigation";
import { useDashboardContext } from "@/context/DashboardContext";

import { CLINIC_STATUS_COLOR } from "@/lib/constants";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import Tooltip from "@mui/material/Tooltip";

export default function ClinicsTable() {
  const router = useRouter();
  const dashboard = useDashboardContext();

  const clinics = dashboard?.clinics ?? [];
  const page = dashboard?.page ?? 1;
  const totalPages = dashboard?.totalPages ?? 1;
  const setPage = dashboard?.setPage ?? (() => {});
  const loading = dashboard?.loading ?? false;
  const campaignStatus = dashboard?.campaignStatus ?? { total_clinics: 0 };

  const isDashboardEmpty = clinics.length === 0;

  return (
    <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-27vh)] min-h-40">
      <div className="overflow-y-auto overflow-x-hidden flex-1">
        {clinics.length === 0 ? (
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
                <th>Email Status</th>
                <th>Average Rating</th>
                <th>Last Contact Date</th>
                <th>Next Contact Date</th>
                <th>Notes</th>
                <th>Expand</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((c) => (
                <tr key={c.id} className="border-b border-gray-200 h-12">
                  <td>{c.id}</td>

                  <td className="truncate max-w-35 cursor-pointer!">
                    <Tooltip title={c.name}>
                      <span className="inline-block truncate w-full">
                        {c.name}
                      </span>
                    </Tooltip>
                  </td>

                  <td>{c.lead_score}</td>

                  <td className="truncate max-w-40 cursor-pointer!">
                    <Tooltip title={c.type.join(", ")}>
                      <span className="inline-block truncate w-full">
                        {c.type.join(", ")}
                      </span>
                    </Tooltip>
                  </td>

                  <td>{c.city}</td>
                  <td>{c.province}</td>
                  <td>
                    <span
                      className={`whitespace-nowrap font-semibold px-2 py-1 rounded-xl text-xs ${
                        CLINIC_STATUS_COLOR[c.email_status]
                      }`}
                    >
                      {c.email_status}
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

                  <td className="truncate max-w-40 cursor-pointer!">
                    <Tooltip title={c.notes || ""}>
                      <span className="inline-block truncate w-full">
                        {c.notes || (
                          <HorizontalRuleIcon className="text-gray-500 text-sm" />
                        )}
                      </span>
                    </Tooltip>
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

      {clinics.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-400 bg-gray-50 text-sm">
          <p className="text-gray-600">
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
            <span className="ml-4">
              Total Records{" "}
              <span className="font-semibold">
                {campaignStatus.total_clinics}
              </span>
            </span>
          </p>

          <div className="flex gap-4">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 rounded border border-gray-500 disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              Prev
            </button>

            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded border border-gray-500 disabled:opacity-40 hover:bg-gray-100 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
