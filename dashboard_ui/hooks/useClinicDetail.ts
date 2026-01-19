"use client";

import { useEffect, useState } from "react";
import { Clinic, ClinicEmails } from "@/lib/types";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function useClinicDetail(clinicId: string) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [emails, setEmails] = useState<ClinicEmails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;

    const controller = new AbortController();

    async function fetchClinic() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_URL}/clinics/${clinicId}`, {
          credentials: "include",
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Clinic not found");

        const data = await res.json();
        setClinic(data);
        setEmails(data.emails_for_outreach || []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message || "Failed to fetch clinic");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchClinic();

    return () => controller.abort();
  }, [clinicId]);

  return { clinic, emails, loading, error };
}
