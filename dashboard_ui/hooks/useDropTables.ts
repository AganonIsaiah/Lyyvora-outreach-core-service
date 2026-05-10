"use client";

import { useState } from "react";
import { useConfirm } from "@/context/ConfirmContext";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export function useDropTables() {
  const [loading, setLoading] = useState(false);
  const { confirm, notify } = useConfirm();

  const dropTables = async () => {
    if (loading) return;

    const confirmed = await confirm({
      title: "Clear Database",
      message:
        "This will permanently delete all clinic and campaign data. This cannot be undone.",
      confirmLabel: "Clear Database",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(`${BASE_URL}/drop-tables`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to drop tables");
      }

      const data = await response.json();
      await notify("Success", data.message || "Database cleared successfully.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      await notify("Error", "Failed to clear the database. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    dropTables,
    loading,
  };
}
