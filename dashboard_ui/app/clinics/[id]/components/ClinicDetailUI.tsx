"use client";

import { useEffect, useState } from "react";
import { Clinic, ClinicEmails } from "@/lib/types";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";

interface Props {
  clinicId: string;
}

const BASE_URL = "http://localhost:8000";

export default function ClinicDetailUI({ clinicId }: Props) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [emails, setEmails] = useState<ClinicEmails[]>([]);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const res = await fetch(`${BASE_URL}/clinics/${clinicId}`);
        if (!res.ok) throw new Error("Clinic not found");
        const data = await res.json();
        setClinic(data);
        setEmails(data.emails_for_outreach || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchClinic();
  }, [clinicId]);

  if (!clinic) return <div>Loading clinic...</div>;

  const displayValue = (value: any) => {
    if (Array.isArray(value))
      return value.length > 0 ? value.join(", ") : "N/A";
    if (typeof value === "number") return value > 0 ? value : "N/A";
    return value && value.toString().trim() !== "" ? value : "N/A";
  };

  const formatTopFeatures = (featuresStr: string) => {
    if (!featuresStr || featuresStr === "[]") return ["N/A"];
    return featuresStr
      .replace(/^\[|\]$/g, "")
      .split(/",\s*"/)
      .map((f) => f.replace(/^"|"$/g, "").trim());
  };

  const topFeatures = formatTopFeatures(clinic.top_features);

  return (
    <div className="w-full min-h-screen p-6 bg-gray-50 flex justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {displayValue(clinic.name) || "Clinic Name"}
        </h1>

        <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <div className="flex-1">
              <p>
                <span className="font-semibold">Email:</span>{" "}
                {displayValue(clinic.email)}
              </p>
              <p>
                <span className="font-semibold">Website:</span>{" "}
                {clinic.website_url ? (
                  <a
                    href={clinic.website_url}
                    target="_blank"
                    className="text-indigo-600 underline"
                  >
                    {clinic.website_url}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
              <p>
                <span className="font-semibold">Type:</span>{" "}
                {displayValue(clinic.type)}
              </p>
              <p>
                <span className="font-semibold">Location:</span>{" "}
                {displayValue(clinic.city)}, {displayValue(clinic.province)}
              </p>
            </div>

            <div className="flex-1 mt-4 sm:mt-0">
              <p>
                <span className="font-semibold">Total Reviews:</span>{" "}
                {displayValue(clinic.total_reviews)}
              </p>
              <p>
                <span className="font-semibold">Average Rating:</span>{" "}
                {displayValue(clinic.average_rating)}
              </p>
              <p>
                <span className="font-semibold">Lead Score:</span>{" "}
                {displayValue(clinic.lead_score)}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={`whitespace-nowrap font-semibold px-2 py-1 rounded-xl text-xs ${
                    CLINIC_STATUS_COLOR[clinic.email_status]
                  }`}
                >
                  {displayValue(clinic.email_status)}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Top Features:</p>
            <div className="flex flex-wrap gap-2">
              {topFeatures.map((feature, i) => (
                <span
                  key={i}
                  className="bg-indigo-100 text-indigo-800 text-xs font-medium px-4! py-2! rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Website Description:</p>
            <p className="text-gray-700">{displayValue(clinic.notes)}</p>
          </div>

          {emails.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold mb-2">Emails for Outreach:</p>
              <div className="flex flex-col gap-4">
                {emails.map((email, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <p className="text-sm font-medium mb-1">
                      <span className="font-semibold">Type:</span>{" "}
                      {displayValue(email.type)}
                    </p>
                    <p className="text-sm mb-1">
                      <span className="font-semibold">Subject:</span>{" "}
                      {displayValue(email.subject_line)}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Body:</span>{" "}
                      {displayValue(email.email_body)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
