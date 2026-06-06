"use client";

import { useDashboardContext } from "@/context/DashboardContext";

export default function CampaignStats() {
  const {
    showExport,
    notGeneratedEmailsCount,
    sentCount,
    repliedCount,
    noResponseCount,
    total,
  } = useDashboardContext();

  if (!showExport) return null;

  const totalGenerated = total - notGeneratedEmailsCount;

  const totalGeneratedPct =
    total > 0 ? Math.min((totalGenerated / total) * 100, 100) : 0;
  const sentPct =
    total > 0 ? Math.min(((sentCount ?? 0) / total) * 100, 100) : 0;
  const repliedPct =
    total > 0 ? Math.min(((repliedCount ?? 0) / total) * 100, 100) : 0;
  const noResponsePct =
    total > 0 ? Math.min(((noResponseCount ?? 0) / total) * 100, 100) : 0;

  const stats = [
    {
      label: "Total Generated",
      value: totalGenerated,
      of: total,
      pct: totalGeneratedPct,
      color: "#d22624", 
    },
    {
      label: "Clinics Contacted",
      value: sentCount ?? 0,
      of: total,
      pct: sentPct,
      color: "#cb7348", // crimson
    },
    {
      label: "Replies Received",
      value: repliedCount ?? 0,
      of: total,
      pct: repliedPct,
      color: "#51A687", 
    },
    {
      label: "No Response",
      value: noResponseCount ?? 0,
      of: total,
      pct: noResponsePct,
      color: "#d0c4b2", // bone
    },
  ];

  return (
    <div className="flex gap-4">
      <div className="p-2 flex flex-col justify-center gap-2 w-50 shrink-0">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Total Clinics
        </p>
        <span className="text-6xl font-bold text-gray-900">{total}</span>
      </div>

      <div className="grid grid-cols-4 gap-x-6 gap-y-4 flex-1">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-3"
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {s.label}
            </p>
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold text-gray-900">
                {s.value}
              </span>
              <span className="text-sm text-gray-400 pb-0.5">/ {s.of}</span>
            </div>
            <div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
              <p className="text-xs font-medium mt-1.5" style={{ color: s.color }}>
                {Math.round(s.pct)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
