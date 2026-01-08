"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import EmergencyIcon from '@mui/icons-material/Emergency';

export default function CampaignOutreach() {
  const { campaignStatus, setCampaignStatus, clinics } = useDashboardContext();

  if (!campaignStatus || !clinics || clinics.length <= 0) return null;

  const { daily_email_limit, follow_up_1, follow_up_2, prompt, contacted_clinics, total_clinics } = campaignStatus;

  const percentage = Math.min((contacted_clinics / total_clinics) * 100, 100);

  const updateStatus = (key: keyof typeof campaignStatus, value: number | string) => {
    setCampaignStatus({
      ...campaignStatus,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col justify-center gap-4 h-full! w-full! card-section">
      <span className="flex justify-between items-center">
        <span className="flex flex-col gap-0.25">
          <h2>Campaign Status</h2>
          <p className="text-slate-400 text-xs flex gap-1 items-center">
            <EmergencyIcon className="text-[10px]!"/>Adjust settings before starting campaign
          </p>
        </span>
        <button className="bg-indigo-500! text-white font-semibold rounded px-2 py-1 h-8! cursor-pointer hover:bg-indigo-600! transition-all duration-200">
          Export CSV
        </button>
      </span>

      <div className="flex items-center justify-evenly">
        <span className="flex flex-col">
          <label htmlFor="daily-email-limit" className="label-outreach">Daily Email Limit</label>
          <input
            type="number"
            id="daily-email-limit"
            className="input-outreach"
            value={daily_email_limit ?? 0}
            onChange={(e) => updateStatus("daily_email_limit", parseInt(e.target.value))}
          />
        </span>

        <span className="flex flex-col">
          <label htmlFor="follow-1" className="label-outreach">Follow-up 1 (days)</label>
          <input
            type="number"
            id="follow-1"
            className="input-outreach"
            value={follow_up_1 ?? 0}
            onChange={(e) => updateStatus("follow_up_1", parseInt(e.target.value))}
          />
        </span>

        <span className="flex flex-col">
          <label htmlFor="follow-2" className="label-outreach">Follow-up 2 (days)</label>
          <input
            type="number"
            id="follow-2"
            className="input-outreach"
            value={follow_up_2 ?? 0}
            onChange={(e) => updateStatus("follow_up_2", parseInt(e.target.value))}
          />
        </span>
      </div>

      <div className="flex flex-col">
        <label htmlFor="prompt" className="label-outreach">Prompt Template</label>
        <textarea
          id="prompt"
          className="resize-none! input-outreach border w-full! min-h-50! border-gray-300 rounded px-2 py-1"
          value={prompt ?? " "}
          onChange={(e) => updateStatus("prompt", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-gray-500">Campaign Progress</p>
        <div className="w-full bg-slate-100 border border-slate-200 rounded-full h-2.5 overflow-hidden">
          <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="text-xs text-gray-500">
          {contacted_clinics} of {total_clinics} clinics contacted ({Math.round(percentage)}%)
        </span>
      </div>
    </div>
  );
}
