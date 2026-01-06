"use client";

import { Metric } from "@/lib/types";

interface MetricUIProps {
  metric: Metric;
}

export default function MetricUI({ metric }: MetricUIProps) {
  const { label, value, desc, descValue } = metric;

  const formattedDescValue =
    typeof descValue === "number"
      ? descValue < 1 && descValue > -1
        ? `${Math.round(descValue * 100)}%`
        : descValue > 0
        ? `+${descValue}`
        : `${descValue}`
      : null;

  const descColor =
    typeof descValue === "number"
      ? descValue > 0
        ? "text-green-600"
        : descValue < 0
        ? "text-red-600"
        : "text-gray-500"
      : "text-gray-500";

  return (
    <div className="flex flex-col gap-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm w-60 justify-center items-center">
      <p className="text-xs text-gray-500 font-medium">{label}</p>

      <p className="text-2xl font-semibold text-gray-900">{value}</p>

      {formattedDescValue && (
        <div className="text-xs flex gap-1 items-center">
          <span className={descColor}>
            {formattedDescValue} {desc}
          </span>
        </div>
      )}
    </div>
  );
}
