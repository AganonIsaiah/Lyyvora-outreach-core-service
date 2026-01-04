"use client";

import { useRouter } from "next/navigation";

import { Clinic } from "@/lib/types";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";

import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";

export default function ClinicsTable({
  clinicsInfo,
}: {
  clinicsInfo: Clinic[];
}) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="h-13 flex justify-center items-center">
        Recent Clinic Activity
      </h2>

      <div className="overflow-y-auto h-[calc(100vh-45vh)]!">
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
              <th className="min-w-35!">Last Contact Date</th>
              <th className="min-w-35!">Next Contact Date</th>
              <th>Notes</th>
              <th>Expand</th>
            </tr>
          </thead>
          <tbody>
            {clinicsInfo.map((c) => (
              <tr key={c.id} className="border-b border-gray-200 h-12">
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.leadScore}</td>
                <td>{c.type.join(", ")}</td>
                <td>{c.city}</td>
                <td>{c.province}</td>
                <td>
                  <span
                    className={`whitespace-nowrap font-semibold px-2 py-1 rounded-xl text-xs
                  ${CLINIC_STATUS_COLOR[c.status]}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td>{c.averageRating}</td>
                <td>
                  {c.lastContactDate ? (
                    <p>{c.lastContactDate}</p>
                  ) : (
                    <p>
                      <HorizontalRuleIcon className="text-gray-500 text-sm!" />
                    </p>
                  )}
                </td>
                <td>
                  {c.nextContactDate ? (
                    <p>{c.nextContactDate}</p>
                  ) : (
                    <p>
                      <HorizontalRuleIcon className="text-gray-500 text-sm!" />
                    </p>
                  )}
                </td>
                <td className="truncate max-w-40">{c.notes}</td>
                <td>
                  <button
                    onClick={() => router.push(`/dashboard/clinics/${c.id}`)}
                    className="cursor-pointer"
                  >
                    <ZoomOutMapIcon
                      fontSize="small"
                      className="text-gray-500 hover:text-black!"
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
