"use client";

import MetricUI from "./MetricUI";
import { mockMetrics } from "@/mock/dashboard-data";

export default function PipelineMetrics() {
  return (
    <div className="flex flex-col justify-between">
      {mockMetrics.map((metric) => (
        <MetricUI key={metric.label} metric={metric} />
      ))}
    </div>
  );
}
