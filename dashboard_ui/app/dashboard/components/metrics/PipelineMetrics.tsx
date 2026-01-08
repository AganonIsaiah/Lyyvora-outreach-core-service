"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import MetricUI from "./MetricUI";

export default function PipelineMetrics() {
  const { metrics, clinics } = useDashboardContext();

  if (!clinics || clinics.length <= 0) return;

  return (
    <div className="flex flex-wrap gap-y-10 gap-x-2 justify-evenly w-120!">
      {metrics.length > 0 ? (
        metrics.map((metric) => <MetricUI key={metric.label} metric={metric} />)
      ) : (
        <p className="text-gray-500">No metrics available</p>
      )}
    </div>
  );
}
