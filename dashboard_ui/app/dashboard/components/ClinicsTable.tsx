"use client";

import { Clinic } from "@/lib/types";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";

export default function ClinicsTable({
  clinicsInfo,
}: {
  clinicsInfo: Clinic[];
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <h2>Recent Clinic Activity</h2>

      <div className="overflow-x-auto h-[calc(100vh-50vh)]!">
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
                <td>{c.lastContactDate}</td>
                <td>{c.nextContactDate}</td>
                <td className="truncate max-w-40">{c.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
