"use client";

import { useState } from "react";
import { useDashboardContext } from "@/context/DashboardContext";

export const useExportSmartlead = () => {
  const { filters } = useDashboardContext();
  const [exportLoading, setExportLoading] = useState(false);

  const exportCSV = async () => {
    setExportLoading(true);
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/export-smartlead-csv`;

      const selectedBatch = filters?.campaign_batch?.[0];
      if (selectedBatch) {
        const params = new URLSearchParams({ campaign_batch: selectedBatch });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = selectedBatch
        ? `smartlead_${selectedBatch}.csv`
        : "smartlead_ready.csv";

      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  };

  return { exportCSV, exportLoading };
};