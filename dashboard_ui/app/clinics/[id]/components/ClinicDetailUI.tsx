"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";
import { EmailSchedule } from "@/lib/types";
import useClinicDetail from "@/hooks/useClinicDetail";
import Loading from "../loading";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const nowDatetimeLocal = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

interface Props {
  clinicId: string;
}

export default function ClinicDetailUI({ clinicId }: Props) {
  const { clinic, emails, loading, error } = useClinicDetail(clinicId);
  const router = useRouter();
  const [schedule, setSchedule] = useState<Partial<EmailSchedule>>({});

  useEffect(() => {
    if (clinic?.schedule) setSchedule(clinic.schedule);
  }, [clinic]);

  const handleScheduleChange = async (sequence: 1 | 2 | 3, value: string) => {
    const key = `send_${sequence}_at` as keyof EmailSchedule;
    setSchedule((prev) => ({ ...prev, [key]: value }));
    await fetch(`${BASE_URL}/emails/schedule/${schedule.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: new Date(value).toISOString() }),
    });
  };

  const handleSendNow = async (sequence: 1 | 2 | 3) => {
    await fetch(`${BASE_URL}/emails/send-now/${schedule.id}/${sequence}`, {
      method: "POST",
      credentials: "include",
    });
  };

  const handleMarkDelivered = async () => {
    await fetch(`${BASE_URL}/clinics/${clinicId}/mark-delivered`, {
      method: "PATCH",
      credentials: "include",
    });
  };

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
        {/* Left side */}
        <div className="flex flex-col gap-4 w-1/2!">
          {/* Top left, Email Name and Data */}
          <div className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
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
                <p className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={`whitespace-nowrap font-semibold px-2 py-0.5 rounded-xl text-xs! ${
                      CLINIC_STATUS_COLOR[clinic.email_status]
                    }`}
                  >
                    {displayValue(clinic.email_status)}
                  </span>
                  {clinic.email_status !== "Delivered" && (
                    <button
                      onClick={handleMarkDelivered}
                      className="text-xs! bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-200 transition-all duration-200"
                    >
                      Mark Delivered
                    </button>
                  )}
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
                    className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Website Description:</p>
              <p className="text-gray-700 text-sm">
                {displayValue(clinic.notes)}
              </p>
            </div>
          </div>

          {/* bottom left, scheduled email outreach times */}
          <div className="bg-white shadow rounded-lg p-6">
            <p className="font-semibold mb-2">Outreach Scheduler:</p>

            <div className="flex gap-3">
              {([1, 2, 3] as const).map((i) => {
                const labels = { 1: "Initial Outreach", 2: "Follow-up 1", 3: "Follow-up 2" };
                const sendAt = schedule[`send_${i}_at` as keyof EmailSchedule] as string | null | undefined;
                const isSent = schedule[`status_${i}` as keyof EmailSchedule] === "sent";

                return (
                  <div key={i} className="flex flex-col w-50!">
                    <label className="label-outreach">{labels[i]}</label>
                    <input
                      type="datetime-local"
                      className="input-outreach h-9! w-44! text-sm!"
                      value={sendAt ? toDatetimeLocal(sendAt) : ""}
                      min={nowDatetimeLocal()}
                      disabled={isSent}
                      onChange={(e) => handleScheduleChange(i, e.target.value)}
                    />
                    <button
                      className="w-30! mt-2.5 bg-indigo-500! text-white font-semibold rounded px-2 py-1 h-8! transition-all cursor-pointer duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSent || !schedule.id}
                      onClick={() => handleSendNow(i)}
                    >
                      {isSent ? "Sent" : "Send Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* full-page right, three emails for outreach */}
        <div className="w-1/2! bg-white! shadow rounded-lg p-6">
          <p className="font-semibold mb-2">Emails for Outreach:</p>

          {emails.length <= 0 && (
            <div className="p-1 text-gray-500 font-semibold text-sm!">
              {" "}
              No emails have been generated for this clinic yet.
            </div>
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
