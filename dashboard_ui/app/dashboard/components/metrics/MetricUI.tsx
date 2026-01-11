"use client";

import { Metric } from "@/lib/types";

interface MetricUIProps {
  metric: Metric;
}

export default function MetricUI({ metric }: MetricUIProps) {
  const { label, value, desc, desc_value } = metric;

  const formatteddesc_value =
    typeof desc_value === "number"
      ? desc_value < 1 && desc_value > -1
        ? `${Math.round(desc_value * 100)}%`
        : desc_value > 0
        ? `+${desc_value}`
        : `${desc_value}`
      : null;

  const descColor =
    typeof desc_value === "number"
      ? desc_value > 0
        ? "text-green-600"
        : desc_value < 0
        ? "text-red-600"
        : "text-gray-500"
      : "text-gray-500";

  return (
    <div className="flex flex-col gap-1 p-4 bg-white border border-gray-200 rounded-lg shadow-sm w-1/2! h-25! justify-center items-center">
      <p className="text-xs text-gray-500 font-medium">{label ?? ""}</p>

      <p className="text-2xl font-semibold text-gray-900">{value ?? 0}</p>

      {formatteddesc_value && (
        <div className="text-xs flex gap-1 items-center">
          <span className={descColor}>
            {formatteddesc_value} {desc}
          </span>
        </div>
      )}
    </div>
  );
}
