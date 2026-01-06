"use client";

import { useState } from "react";
import { Clinic, ClinicEmails, ClinicStatus } from "@/lib/types";

interface Props {
  clinic: Clinic;
}

export default function ClinicDetailUI({ clinic }: Props) {
  const [emails, setEmails] = useState<ClinicEmails[]>(clinic.emailsForOutreach);

  const getStageIndex = () => {
    switch (clinic.status) {
      case ClinicStatus.NOT_QUEUED:
      case ClinicStatus.NOT_CONTACTED:
        return 0;
      case ClinicStatus.EMAIL_1_SENT:
        return 0;
      case ClinicStatus.FOLLOW_UP_1:
        return 1;
      case ClinicStatus.FOLLOW_UP_2:
        return 2;
      case ClinicStatus.REPLIED:
        return 2;
      default:
        return 0;
    }
  };

  const currentStage = getStageIndex();

  return (
    <div className="flex w-full min-h-screen p-6 gap-6 overflow-auto bg-gray-50">
      <div className="flex flex-col w-1/4 gap-4">
        <h2 className="font-semibold text-lg">Email Sequence</h2>
        {emails.map((email, idx) => (
          <div key={email.type} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-4 w-4 rounded-full border-2 ${
                  idx <= currentStage
                    ? "bg-indigo-500 border-indigo-500"
                    : "bg-gray-300 border-gray-300"
                }`}
              ></div>
              {idx < emails.length - 1 && <div className="h-full w-px bg-gray-300 flex-1"></div>}
            </div>

            <div>
              <p className={`text-sm font-medium ${idx === currentStage ? "text-indigo-600" : "text-gray-600"}`}>
                {email.type}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">{clinic.name}</h1>

        <div className="flex flex-col gap-2 text-gray-700">
          <p>
            <span className="font-semibold">Email:</span> {clinic.email}
          </p>
          <p>
            <span className="font-semibold">Website:</span>{" "}
            <a href={clinic.websiteUrl} target="_blank" className="text-indigo-600 underline">
              {clinic.websiteUrl}
            </a>
          </p>
          <p>
            <span className="font-semibold">Type:</span> {clinic.type.join(", ")}
          </p>
          <p>
            <span className="font-semibold">Location:</span> {clinic.city}, {clinic.province}
          </p>
          <p>
            <span className="font-semibold">Top Features:</span> {clinic.topFeatures}
          </p>
          <p>
            <span className="font-semibold">Total Reviews:</span> {clinic.totalReviews} |{" "}
            <span className="font-semibold">Avg Rating:</span> {clinic.averageRating} |{" "}
            <span className="font-semibold">Lead Score:</span> {clinic.leadScore}
          </p>
          <p>
            <span className="font-semibold">Notes:</span> {clinic.notes}
          </p>
          <p>
            <span className="font-semibold">Status:</span> {clinic.status}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {emails.map((email, idx) => (
            <div key={email.type} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <p className="text-xs text-gray-500 font-medium">{email.type}</p>
              <input
                type="text"
                className="w-full border-b border-gray-300 py-1 px-2 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                value={email.subjectLine}
                onChange={(e) =>
                  setEmails((prev) =>
                    prev.map((em, i) => (i === idx ? { ...em, subjectLine: e.target.value } : em))
                  )
                }
              />
              <textarea
                className="w-full mt-2 p-2 border border-gray-300 rounded resize-none h-40 focus:outline-none focus:border-indigo-500 text-sm"
                value={email.emailBody}
                onChange={(e) =>
                  setEmails((prev) =>
                    prev.map((em, i) => (i === idx ? { ...em, emailBody: e.target.value } : em))
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
