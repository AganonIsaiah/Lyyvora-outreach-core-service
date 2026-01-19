"use client";

import { useRouter } from "next/navigation";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";
import useClinicDetail from "@/hooks/useClinicDetail";
import Loading from "../loading";

interface Props {
  clinicId: string;
}

export default function ClinicDetailUI({ clinicId }: Props) {
  const { clinic, emails, loading, error } = useClinicDetail(clinicId);
  const router = useRouter();

  const redirectToDashboard = () => router.push("/dashboard");

  if (loading) return <Loading />
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!clinic) return <div>Clinic not found</div>;

  const displayValue = (value: any) => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A";
    if (typeof value === "number") return value > 0 ? value : "N/A";
    return value && value.toString().trim() !== "" ? value : "N/A";
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return "N/A";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return digits;
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="flex justify-evenly items-center separator w-full bg-white">
        <h1 className="text-3xl font-bold text-gray-800">
          {displayValue(clinic.name) || "Clinic Name"}
        </h1>

        <button
          className="text-sm! bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-lg border border-gray-200 cursor-pointer transition-all duration-200 hover:bg-slate-300"
          onClick={redirectToDashboard}
        >
          Dashboard
        </button>
      </div>

      <div className="w-full max-w-3xl m-4 flex flex-col gap-6 mt-6">
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
              <p>
                <span className="font-semibold">Phone:</span>{" "}
                {formatPhoneNumber(clinic.phone)}
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-1">Top Features:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              {topFeatures.map((feature, i) => (
                <span
                  key={i}
                  className="bg-indigo-100 text-indigo-800 text-xs font-medium px-3 py-2 rounded-full"
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
            <div className="mt-2">
              <p className="font-semibold mb-2">Emails for Outreach:</p>
              <div className="flex flex-col gap-6">
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
                    <p className="text-sm whitespace-pre-wrap">
                      <span className="font-semibold">Body:</span>{" "}
                      {email.email_body}
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
