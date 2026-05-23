"use client";

import { useEffect, useState } from "react";
import { CLINIC_STATUS_COLOR } from "@/lib/constants";
import { EmailSchedule } from "@/lib/types";
import useClinicDetail from "@/hooks/useClinicDetail";
import { useConfirm } from "@/context/ConfirmContext";
import Loading from "../loading";
import Header from "@/shared/Header";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

const NAMED_LINKS: Record<string, string> = {
  "https://calendar.app.google/nK7cT3FXwYBGCgWU6": "Book a time here",
  "https://lyyvora.com": "Discover Lyyvora",
  "http://lyyvora.com": "Discover Lyyvora",
};

function renderEmailBody(text: string) {
  // Create regex fresh each call to avoid /g flag lastIndex issues
  const urlRe = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRe);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      const label = NAMED_LINKS[part] ?? part;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-semibold hover:text-blue-800"
        >
          {label}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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
  const { confirm } = useConfirm();
  const [schedule, setSchedule] = useState<Partial<EmailSchedule>>({});
  const [sentSequences, setSentSequences] = useState<Set<number>>(new Set());

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
    const labels: Record<number, string> = {
      1: "Initial Outreach",
      2: "Follow-up 1",
      3: "Follow-up 2",
    };
    const ok = await confirm({
      title: `Send ${labels[sequence]}`,
      message: "This will send the email immediately to the clinic. Are you sure?",
      confirmLabel: "Send Now",
    });
    if (!ok) return;
    setSentSequences((prev) => new Set(prev).add(sequence));
    await fetch(`${BASE_URL}/emails/send-now/${schedule.id}/${sequence}`, {
      method: "POST",
      credentials: "include",
    });
  };

  const handleMarkReplied = async () => {
    await fetch(`${BASE_URL}/clinics/${clinicId}/mark-replied`, {
      method: "PATCH",
      credentials: "include",
    });
  };

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

  const SEQUENCE_LABELS: Record<number, string> = {
    1: "Initial Outreach",
    2: "Follow-up 1",
    3: "Follow-up 2",
  };

  const STATUS_STYLE: Record<string, string> = {
    sent: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    cancelled: "bg-gray-100 text-gray-400",
    failed: "bg-red-100 text-red-600",
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header title={displayValue(clinic.name)} showDashboardButton />

      {/* Body — two equal-height columns */}
      <div className="flex-1 flex gap-5 overflow-hidden p-5 min-h-0">

        {/* Left column */}
        <div className="flex flex-col gap-4 w-1/2 min-h-0">

          {/* Clinic info — notes-only scrollable */}
          <div className="flex-1 bg-white rounded-xl shadow-sm p-6 overflow-hidden min-h-0 flex flex-col gap-5">
            <p className="text-lg font-semibold text-gray-700 shrink-0 -mb-1">Clinic Information</p>
            <div className="flex gap-6">              
              <div className="flex-1 flex flex-col gap-1.5 text-sm">
                <p><span className="font-semibold text-gray-700">Email:</span> {displayValue(clinic.email)}</p>
                <p>
                  <span className="font-semibold text-gray-700">Website:</span>{" "}
                  {clinic.website_url
                    ? <a href={clinic.website_url} target="_blank" className="text-indigo-600 underline">{clinic.website_url}</a>
                    : "N/A"}
                </p>
                <p><span className="font-semibold text-gray-700">Type:</span> {displayValue(clinic.type)}</p>
                <p><span className="font-semibold text-gray-700">Location:</span> {displayValue(clinic.city)}, {displayValue(clinic.province)}</p>
                <p><span className="font-semibold text-gray-700">Phone:</span> {formatPhoneNumber(clinic.phone)}</p>
              </div>

              <div className="flex-1 flex flex-col gap-1.5 text-sm">
                <p><span className="font-semibold text-gray-700">Total Reviews:</span> {displayValue(clinic.total_reviews)}</p>
                <p><span className="font-semibold text-gray-700">Average Rating:</span> {displayValue(clinic.average_rating)}</p>
                <p><span className="font-semibold text-gray-700">Lead Score:</span> {displayValue(clinic.lead_score)}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className={`whitespace-nowrap font-semibold px-2 py-0.5 rounded-xl text-xs ${CLINIC_STATUS_COLOR[clinic.email_status]}`}>
                    {displayValue(clinic.email_status)}
                  </span>
                  {clinic.email_status !== "Replied" && (
                    <button
                      onClick={handleMarkReplied}
                      className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-xl border border-blue-200 cursor-pointer hover:bg-blue-200 transition-all duration-200"
                    >
                      Mark Replied
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Top Features</p>
              <div className="flex flex-wrap gap-2">
                {topFeatures.map((feature, i) => (
                  <span key={i} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <p className="text-sm font-semibold text-gray-700 mb-1 shrink-0">Website Description</p>
              <div className="flex-1 min-h-0 overflow-y-scroll scroll-visible text-gray-600 text-sm leading-relaxed pr-2">
                {displayValue(clinic.notes)}
              </div>
            </div>
          </div>

          {/* Outreach scheduler — timeline, fixed height */}
          <div className="shrink-0 bg-white rounded-xl shadow-sm p-6">
            <p className="text-lg font-semibold text-gray-700 mb-3">Outreach Schedule</p>

            <div className="flex flex-col gap-0">
              {([1, 2, 3] as const).map((i, idx) => {
                const sendAt = schedule[`send_${i}_at` as keyof EmailSchedule] as string | null | undefined;
                const status = (schedule[`status_${i}` as keyof EmailSchedule] as string) || "pending";
                const isSent = status === "sent" || sentSequences.has(i);
                const isCancelled = status === "cancelled";

                return (
                  <div key={i} className="flex items-center gap-4 relative">
                    {/* Connector line */}
                    {idx < 2 && (
                      <div className={`absolute left-4.5 top-10 w-px h-6.5 bg-gray-200 ${isSent ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"}`} />
                    )}

                    {/* Step circle */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSent ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {i}
                    </div>

                    {/* Row content */}
                    <div className="flex-1 flex items-center justify-between py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-gray-700">{SEQUENCE_LABELS[i]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLE[status] ?? "bg-gray-100 text-gray-400"}`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <input
                          type="datetime-local"
                          className="input-outreach h-8! text-xs! w-40!"
                          value={sendAt ? toDatetimeLocal(sendAt) : ""}
                          min={nowDatetimeLocal()}
                          disabled={isSent || isCancelled}
                          onChange={(e) => handleScheduleChange(i, e.target.value)}
                        />
                        <button
                          className="w-21! bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded cursor-pointer transition-all duration-200 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSent || isCancelled || !schedule.id}
                          onClick={() => handleSendNow(i)}
                        >
                          {isSent ? "Sent" : "Send Now"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column — emails, scrollable */}
        <div className="w-1/2 min-h-0 bg-white rounded-xl shadow-sm p-6 flex flex-col">
          <p className="text-lg font-semibold text-gray-700 mb-3 shrink-0">Emails for Outreach</p>

          {emails.length === 0 ? (
            <p className="text-gray-400 text-sm">No emails have been generated for this clinic yet.</p>
          ) : (
            <div className="flex-1 overflow-y-scroll scroll-visible min-h-0 flex flex-col gap-4 pr-2">
              {emails.map((email, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {email.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Subject:</span>{" "}
                    {displayValue(email.subject_line)}
                  </p>
                  <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                    <span className="font-semibold text-gray-700">Body:</span>{" "}
                    {renderEmailBody(email.email_body)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
