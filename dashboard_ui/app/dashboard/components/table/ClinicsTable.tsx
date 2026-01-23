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
  const totalClinics = dashboard?.total ?? 0;

  if (!dashboard.showExport)
    return (
      <div className="border border-gray-200 border-t-0 rounded-b-lg shadow-sm">
        <div className="px-4 py-6 text-gray-500 font-semibold">
          Dashboard is empty, click the Import CSV button to populate the table with data.
        </div>
      </div>
    );

  const renderRows = () => {
    if (loading) {
      return Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-200 h-12">
          {Array.from({ length: 11 }).map((_, j) => (
            <td key={j}>
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ));
    }

    if (clinics.length === 0) {
      return (
        <tr>
          <td colSpan={11} className="text-left! py-4! px-8! text-gray-400! text-sm font-semibold">
            No clinics match the selected filters. Try changing your filter options.
          </td>
        </tr>
      );
    }
    return clinics.map((c) => (
      <tr key={c.id} className="border-b border-gray-200 h-12">
        <td>{c.id}</td>
        <td className="truncate">
          <Tooltip title={c.name}>
            <span className="inline-block truncate w-full">{c.name}</span>
          </Tooltip>
        </td>
        <td>{c.lead_score}</td>
        <td className="truncate">
          <Tooltip title={c.type.join(", ")}>
            <span className="inline-block truncate w-full">{c.type.join(", ")}</span>
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
        <td>
          {c.campaign_batch || <HorizontalRuleIcon className="text-gray-500 text-sm" />}
        </td>
        <td>{c.average_rating}</td>
        <td className="truncate">
          <Tooltip title={c.notes || ""}>
            <span className="inline-block truncate w-full">
              {c.notes || <HorizontalRuleIcon className="text-gray-500 text-sm" />}
            </span>
          </Tooltip>
        </td>
        <td>
          <button onClick={() => router.push(`/clinics/${c.id}`)} className="cursor-pointer">
            <ZoomOutMapIcon fontSize="small" className="text-gray-500 hover:text-black" />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="bg-white rounded-b-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-27vh)] min-h-40">
      <div className="overflow-y-auto overflow-x-hidden flex-1">
        <table className="min-w-full divide-y divide-gray-200 w-full table-fixed">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 pr-1">ID</th>
              <th className="w-34">Name</th>
              <th className="w-18">Lead Score</th>
              <th className="w-48">Type</th>
              <th className="w-22">City</th>
              <th className="w-20">Province</th>
              <th className="w-32">Email Status</th>
              <th className="w-48">Campaign Batch ID</th>
              <th className="w-20">Average Rating</th>
              <th className="w-46">Notes</th>
              <th className="w-20">Expand</th>
            </tr>
          </thead>
          <tbody>{renderRows()}</tbody>
        </table>
      </div>

      {clinics.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-400 bg-gray-50 text-sm">
          <p className="text-gray-600">
            Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
            <span className="ml-4">
              Total Records: <span className="font-semibold">{totalClinics}</span>
            </span>
          </p>

          <div className="flex items-center gap-4">
            <span className="mr-2">
              Current Records: <span className="font-semibold">{clinics.length}</span>
            </span>
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
