"use client";

import { useDashboardContext } from "@/context/DashboardContext";

export default function CampaignStats() {
  const {
    showExport,
    notGeneratedEmailsCount,
    sentCount,
    repliedCount,
    total,
    wsClinicsGenerated,
    campaignStatus,
  } = useDashboardContext();

  if (!showExport) return null;

  const number_of_clinics = campaignStatus?.number_of_clinics ?? 0;
  const totalGenerated = total - notGeneratedEmailsCount;

  const batchPct =
    number_of_clinics > 0 && notGeneratedEmailsCount > 0
      ? Math.min(
          (wsClinicsGenerated /
            Math.min(number_of_clinics, notGeneratedEmailsCount)) *
            100,
          100,
        )
      : 0;
  const totalGeneratedPct = total > 0 ? Math.min((totalGenerated / total) * 100, 100) : 0;
  const sentPct = total > 0 ? Math.min(((sentCount ?? 0) / total) * 100, 100) : 0;
  const repliedPct = total > 0 ? Math.min(((repliedCount ?? 0) / total) * 100, 100) : 0;

  const stats = [
    {
      label: "Batch Progress",
      value: wsClinicsGenerated,
      of: number_of_clinics || 0,
      pct: batchPct,
      bar: "bg-indigo-500",
      text: "text-indigo-600",
    },
    {
      label: "Total Generated",
      value: totalGenerated,
      of: total,
      pct: totalGeneratedPct,
      bar: "bg-violet-500",
      text: "text-violet-600",
    },
    {
      label: "Emails Sent",
      value: sentCount ?? 0,
      of: total,
      pct: sentPct,
      bar: "bg-emerald-500",
      text: "text-emerald-600",
    },
    {
      label: "Replies Received",
      value: repliedCount ?? 0,
      of: total,
      pct: repliedPct,
      bar: "bg-blue-500",
      text: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex flex-col gap-3"
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {s.label}
          </p>

          <div className="flex items-end gap-1.5">
            <span className="text-3xl font-bold text-gray-900">{s.value}</span>
            <span className="text-sm text-gray-400 pb-0.5">/ {s.of}</span>
          </div>

          <div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${s.bar} h-full rounded-full transition-all duration-500`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <p className={`text-xs font-medium mt-1.5 ${s.text}`}>
              {Math.round(s.pct)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
