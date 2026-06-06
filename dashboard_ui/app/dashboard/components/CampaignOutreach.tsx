"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import { useGenerateOutreach } from "@/hooks/useGenerateOutreach";

export default function CampaignOutreach() {
  const { showExport, notGeneratedEmailsCount } = useDashboardContext();

  const {
    handleGenerateOutreach,
    updateStatus,
    max_word_limit,
    number_of_clinics,
    prompt,
    loading,
    wsClinicsGenerated,
  } = useGenerateOutreach();

  const batchTotal = Math.min(number_of_clinics || 0, notGeneratedEmailsCount ?? 0);
  const batchPct = batchTotal > 0 ? Math.min((wsClinicsGenerated / batchTotal) * 100, 100) : 0;

  if (!showExport) {
    return (
      <div className="flex items-center justify-center w-full h-full card-section">
        <p className="text-gray-400 text-sm">No campaign data available</p>
      </div>
    );
  }

  return (
    <div className="card-section flex flex-col gap-5 flex-1 h-full">
      <div>
        <h2>Outreach Generator</h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Configure and generate personalized email outreach at scale
        </p>
      </div>

      <div className="flex gap-8">
        <span className="flex flex-col">
          <label htmlFor="max-word-limit" className="label-outreach text-xs!">
            Word Limit <span className="text-gray-400">(max 200)</span>
          </label>
          <input
            type="number"
            id="max-word-limit"
            className="input-outreach"
            max={200}
            value={max_word_limit || ""}
            onChange={(e) => {
              if (e.target.value === "") { updateStatus("max_word_limit", 0); return; }
              const value = parseInt(e.target.value);
              if (isNaN(value)) return;
              updateStatus("max_word_limit", Math.min(Math.max(value, 1), 200));
            }}
          />
        </span>

        <span className="flex flex-col">
          <label htmlFor="batch-size" className="label-outreach text-xs!">
            Batch Size <span className="text-gray-400">(max {Math.min(100, notGeneratedEmailsCount ?? 100)})</span>
          </label>
          <input
            type="number"
            id="batch-size"
            className="input-outreach disabled:opacity-40 disabled:cursor-not-allowed"
            min={1}
            max={Math.min(100, notGeneratedEmailsCount ?? 100)}
            value={number_of_clinics || ""}
            disabled={notGeneratedEmailsCount === 0}
            onChange={(e) => {
              if (e.target.value === "") { updateStatus("number_of_clinics", 0); return; }
              const value = parseInt(e.target.value);
              if (isNaN(value)) return;
              updateStatus("number_of_clinics", Math.min(Math.max(value, 1), Math.min(100, notGeneratedEmailsCount ?? 100)));
            }}
          />
        </span>

        <span className="flex flex-col justify-end">
          <button
            className={`bg-[#d22624]! text-[#f3ece0] font-semibold rounded px-4 py-2 h-10! transition-all duration-200 ${
              loading || !max_word_limit || !number_of_clinics
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-[#2a1311]! cursor-pointer"
            }`}
            onClick={handleGenerateOutreach}
            disabled={loading || !max_word_limit || !number_of_clinics}
          >
            {loading ? "Generating..." : "Generate Outreach"}
          </button>
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium text-gray-600">Batch Progress</span>
          <span className={loading ? "text-[#d22624] font-semibold" : "text-gray-400"}>
            {wsClinicsGenerated} / {batchTotal}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#d22624] h-full rounded-full transition-all duration-500"
            style={{ width: `${batchPct}%` }}
          />
        </div>
        {loading ? (
          <p className="text-xs text-[#cb7348] animate-pulse">Generating...</p>
        ) : (
          <p className="text-xs text-[#d22624] font-medium">{Math.round(batchPct)}% complete</p>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <label htmlFor="prompt" className="label-outreach text-xs!">
          Prompt Template
        </label>
        <textarea
          id="prompt"
          className="resize-none! input-outreach border w-full! flex-1 min-h-50! border-gray-300 rounded px-3 py-2"
          value={prompt ?? ""}
          onChange={(e) => updateStatus("prompt", e.target.value)}
        />
      </div>
    </div>
  );
}
