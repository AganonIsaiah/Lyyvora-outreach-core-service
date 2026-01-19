"use client";

import { useRef, useState } from "react";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export function useImportCsv() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadMode, setUploadMode] = useState<"import" | "append">("import");
  const [loadingReplace, setLoadingReplace] = useState(false);
  const [loadingAppend, setLoadingAppend] = useState(false);

  function openFilePicker(mode: "import" | "append") {
    if (loadingReplace || loadingAppend) return;
    setUploadMode(mode);
    fileInputRef.current?.click();
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      if (uploadMode === "append") {
        setLoadingAppend(true);
      } else {
        setLoadingReplace(true);
      }

      const endpoint = uploadMode === "append" ? "/append-leads" : "/import-csv";

      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("CSV upload failed");

      alert(
        uploadMode === "append"
          ? "CSV appended successfully"
          : "CSV imported successfully"
      );

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${uploadMode} CSV`);
    } finally {
      setLoadingAppend(false);
      setLoadingReplace(false);
      e.target.value = "";
    }
  }

  return {
    fileInputRef,
    loadingReplace,
    loadingAppend,
    openFilePicker,
    handleFileChange,
  };
}
