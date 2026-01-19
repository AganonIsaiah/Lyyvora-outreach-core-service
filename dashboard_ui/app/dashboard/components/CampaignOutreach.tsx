"use client";

import { useDashboardContext } from "@/context/DashboardContext";
import EmergencyIcon from "@mui/icons-material/Emergency";
import { useGenerateOutreach } from "@/hooks/useGenerateOutreach";

export default function CampaignOutreach() {
  const { showExport, notGeneratedEmailsCount } = useDashboardContext();
  const {
    wsClinicsGenerated,
    loading,
    handleGenerateOutreach,
    updateStatus,
    max_word_limit,
    number_of_clinics,
    prompt,
  } = useGenerateOutreach();

  const percentage =
    number_of_clinics > 0 && notGeneratedEmailsCount > 0
      ? Math.min(
          (wsClinicsGenerated /
            Math.min(number_of_clinics, notGeneratedEmailsCount)) *
            100,
          100,
        )
      : 0;

  if (!showExport) {
    return (
      <div className="flex flex-col gap-4 w-full h-full card-section">
        <div className="text-gray-500 text-sm">No campaign data available</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-4 h-full! w-full! card-section">
      <div className="flex justify-between gap-10">
        <div className="flex flex-col items-center justify-evenly">
          <span className="flex justify-between items-center">
            <span className="flex flex-col gap-0.25">
              <h2>Outreach Generator</h2>
              <p className="text-slate-400 text-xs flex gap-1 items-center">
                <EmergencyIcon className="text-[10px]!" />
                Adjust settings before generating email outreach
              </p>
            </span>
          </span>

          <span className="flex flex-col">
            <label htmlFor="max-word-limit" className="label-outreach">
              Max Word Limit
            </label>
            <input
              type="number"
              id="max-word-limit"
              className="input-outreach"
              min={1}
              value={max_word_limit ?? 0}
              onChange={(e) => {
                const value = e.target.value;
                const num = value === "" ? 0 : parseInt(value);
                updateStatus("max_word_limit", isNaN(num) ? 1 : num);
              }}
            />
          </span>

          <span className="flex flex-col">
            <label htmlFor="number-of-clinics" className="label-outreach">
              Number of Clinics
            </label>
            <input
              type="number"
              id="number-of-clinics"
              className="input-outreach"
              value={number_of_clinics ?? 0}
              min={1}
              onChange={(e) => {
                const value = e.target.value;
                const num = value === "" ? 0 : parseInt(value);
                updateStatus("number_of_clinics", isNaN(num) ? 1 : num);
              }}
            />
          </span>

          <button
            className="bg-indigo-500! text-white font-semibold rounded px-2 py-1 h-8! cursor-pointer hover:bg-indigo-600! transition-all duration-200"
            onClick={handleGenerateOutreach}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Outreach"}
          </button>
        </div>

        <div className="flex flex-col flex-1">
          <label htmlFor="prompt" className="label-outreach">
            Prompt Template
          </label>
          <textarea
            id="prompt"
            className="resize-none! input-outreach border w-full! min-h-85! border-gray-300 rounded px-2 py-1"
            value={prompt ?? ""}
            onChange={(e) => updateStatus("prompt", e.target.value)}
          />
        </div>
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
          {wsClinicsGenerated} of {number_of_clinics} clinics contacted (
          {Math.round(percentage)}%)
        </span>
      </div>
    </div>
  );
}
