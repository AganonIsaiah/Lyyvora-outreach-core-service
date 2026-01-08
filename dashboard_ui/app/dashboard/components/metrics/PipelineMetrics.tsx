"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import MetricUI from "./MetricUI";

export default function PipelineMetrics() {
  const { metrics, filteredClinics } = useDashboardContext();

  if (!filteredClinics || filteredClinics.length <= 0) return;

  return (
    <div className="flex justify-between gap-4">
      {metrics.length > 0 ? (
        metrics.map((metric) => <MetricUI key={metric.label} metric={metric} />)
      ) : (
        <p className="text-gray-500">No metrics available</p>
      )}
    </div>
  );
}
