"use client";

import { useState } from "react";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export function useDropTables() {
  const [loading, setLoading] = useState(false);

  const dropTables = async () => {
    if (loading) return;

    const confirmed = confirm(
      "Are you sure you want to clear the database? This cannot be undone."
    );

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
      alert(data.message || "Tables dropped successfully");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Error dropping tables");
    } finally {
      setLoading(false);
    }
  };

  return {
    dropTables,
    loading,
  };
}
