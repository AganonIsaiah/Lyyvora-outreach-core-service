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

  if (loading) return <Loading />;
  else if (error) return <div className="text-red-500">Error: {error}</div>;
  else if (!clinic) return <div>Clinic not found</div>;

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
      <div className="w-full px-8! m-4 flex gap-6 mt-6">
        <div className="w-1/2! bg-white shadow rounded-lg p-6 flex flex-col gap-4 h-full!">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
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
              <p className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={`whitespace-nowrap font-semibold px-2 py-0.5 rounded-xl text-xs! ${
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
        </div>

        <div className="w-1/2! bg-white! shadow rounded-lg p-6">
          <p className="font-semibold mb-2">Emails for Outreach:</p>
          
          {emails.length <= 0 && (
            <div className="p-1 text-gray-500 font-semibold text-sm!"> No emails have been generated for this clinic yet.</div>
          )}

          {emails.length > 0 && (
            <div className="flex flex-col gap-4">
              {emails.map((email, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-2"
                >
                  <p className="text-xs font-medium mb-1">
                    <span className="font-semibold">Type:</span>{" "}
                    {displayValue(email.type)}
                  </p>
                  <p className="text-xs mb-1">
                    <span className="font-semibold">Subject:</span>{" "}
                    {displayValue(email.subject_line)}
                  </p>
                  <p className="text-xs whitespace-pre-wrap">
                    <span className="font-semibold">Body:</span>{" "}
                    {email.email_body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
