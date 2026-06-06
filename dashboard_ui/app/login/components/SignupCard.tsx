"use client";

import { useState, useRef, useEffect } from "react";

type Plan = "starter" | "pro" | "enterprise";

const PLANS: { id: Plan; label: string; price: string; desc: string }[] = [
  { id: "starter", label: "Starter", price: "$12/mo", desc: "Up to 3 users, 3k emails/mo" },
  { id: "pro", label: "Pro", price: "$49/mo", desc: "Up to 15 users, 50k emails/mo" },
  { id: "enterprise", label: "Enterprise", price: "Custom", desc: "Unlimited users & volume" },
];

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function SignupCard() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sizeOpen, setSizeOpen] = useState(false);
  const sizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(e.target as Node)) {
        setSizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [plan, setPlan] = useState<Plan>("pro");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleStepOne = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!companySize) {
      setError("Please select a company size.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      // TODO: wire to POST /register endpoint
      await new Promise((r) => setTimeout(r, 800));
      alert("Account created! Check your email to verify.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 ? "Tell us about your company." : "Set up your login credentials."}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step >= s ? "bg-[#2a1311] text-[#f3ece0]" : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            {s < 2 && <div className={`flex-1 h-px w-8 ${step > s ? "bg-[#2a1311]" : "bg-gray-200"}`} />}
          </div>
        ))}
        <span className="text-xs text-gray-400 ml-1">Step {step} of 2</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleStepOne} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Work email</label>
            <input
              type="email"
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              required
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Company size</label>
            <div ref={sizeRef} className="relative">
              <button
                type="button"
                onClick={() => setSizeOpen((o) => !o)}
                className={`w-full flex items-center justify-between border px-3 py-2.5 rounded-lg text-sm transition cursor-pointer bg-white ${
                  sizeOpen ? "border-[#2a1311] ring-2 ring-[#2a1311]" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className={companySize ? "text-gray-900" : "text-gray-400"}>
                  {companySize ? `${companySize} employees` : "Select company size"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${sizeOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sizeOpen && (
                <ul className="absolute z-20 mt-3 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1 overflow-hidden">
                  {COMPANY_SIZES.map((s) => {
                    const selected = companySize === s;
                    return (
                      <li
                        key={s}
                        onClick={() => { setCompanySize(s); setSizeOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer transition ${
                          selected ? "bg-[#f3ece0]" : "hover:bg-gray-50"
                        }`}
                      >
                        {/* Selection circle */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                          selected ? "border-[#d22624] bg-[#d22624]" : "border-gray-300"
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={selected ? "text-[#2a1311] font-semibold" : "text-gray-700"}>
                          {s} employees
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Plan selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Plan</label>
            <div className="flex flex-col gap-2">
              {PLANS.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center justify-between border rounded-lg px-3.5 py-3 cursor-pointer transition ${
                    plan === p.id
                      ? "border-[#2a1311] bg-[#f3ece0]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={plan === p.id}
                      onChange={() => setPlan(p.id)}
                      className="accent-[#2a1311]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{p.price}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="cursor-pointer w-full bg-[#2a1311] text-[#f3ece0] py-2.5 rounded-lg text-sm font-semibold hover:bg-[#5e261e] transition mt-1"
          >
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              minLength={8}
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1311] focus:border-transparent transition"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 accent-slate-900"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to Lyyvora&apos;s{" "}
              <a href="#" className="text-[#d22624] underline underline-offset-2">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-[#d22624] underline underline-offset-2">Privacy Policy</a>.
            </span>
          </label>

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="cursor-pointer flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer flex-1 bg-[#2a1311] text-[#f3ece0] py-2.5 rounded-lg text-sm font-semibold transition ${
                loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#5e261e]"
              }`}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
