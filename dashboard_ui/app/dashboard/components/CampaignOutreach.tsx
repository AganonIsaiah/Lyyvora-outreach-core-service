"use client";

import { useState } from "react";

export default function CampaignOutreach() {
  const hours = 10;

  const current = 51;
  const total = 591;

  const [limit, setLimit] = useState<number>(4);
  const [follow1, setFollow1] = useState<number>(3);
  const [follow2, setFollow2] = useState<number>(1);

  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div className="flex flex-col gap-4 w-120 p-4 rounded-lg border border-gray-200 shadow-sm">
      <span className="flex justify-between">
        <h2>Campaign Status</h2>
        <button className="bg-indigo-500! text-white font-semibold rounded px-2 py-1">
          Start Campaign
        </button>
      </span>

      <span className="flex items-center gap-4 bg-slate-100 rounded-md p-3 border border-gray-200 shadow-sm">
        <span className="h-3 w-3 bg-green-500 rounded-full blink"></span>
        <span>
          <h3>Automation Active</h3>
          <span className="flex gap-1">
            Next batch sends in <p className="font-semibold">{hours}</p> hours
          </span>
        </span>
      </span>

      <div className="flex items-center justify-between">
        <span className="flex flex-col">
          <label htmlFor="daily-email-limit" className="label-outreach">
            Daily Email Limit
          </label>
          <input
            type="number"
            id="daily-email-limit"
            className="input-outreach"
            onChange={(e) => setLimit(parseInt(e.target.value))}
            value={limit}
          />
        </span>
        <span className="flex flex-col">
          <label htmlFor="follow-1" className="label-outreach">
            Follow-up 1 (days)
          </label>
          <input
            type="number"
            id="follow-1"
            className="input-outreach"
            onChange={(e) => setFollow1(parseInt(e.target.value))}
            value={follow1}
          />
        </span>
        <span className="flex flex-col">
          <label htmlFor="follow-2" className="label-outreach">
            Follow-up 2 (days)
          </label>
          <input
            type="number"
            id="follow-2"
            className="input-outreach"
            onChange={(e) => setFollow2(parseInt(e.target.value))}
            value={follow2}
          />
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-500">Campaign Progress</p>

        <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">
          {current} of {total} clinics contacted ({Math.round(percentage)}%)
        </span>
      </div>
    </div>
  );
}