import AuthPanel from "./components/AuthPanel";

export default function Login() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — 60% */}
      <div className="hidden lg:flex lg:w-3/5 bg-linear-to-br from-white to-gray-50 flex-col justify-between p-12 relative overflow-hidden">
        
        {/* Logo */}
        <div className="relative z-10 flex flex-col">
          <span className="text-[#2a1311] text-5xl font-bold tracking-tight">Outreach</span>
          <span className="ml-1 text-sm font-medium">AI-Powered Email Outreach Service</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 flex flex-col gap-10">
          <div>
            <h1 className="text-[#2a1311] text-4xl font-bold leading-tight tracking-tight mb-4">
              Scale your outreach.<br />
              <span className="text-[#d22624]">Without the guesswork.</span>
            </h1>
            <p className="text-base leading-relaxed max-w-md">
              Outreach helps B2B teams send smarter cold emails, track responses, and close more deals. All from one platform.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              {
                title: "AI-powered personalization",
                desc: "Auto-generate tailored messages at scale based on prospect data.",
              },
              {
                title: "Real-time analytics",
                desc: "Track open rates, replies, and conversions across every campaign.",
              },
              {
                title: "Team collaboration",
                desc: "Manage sequences, templates, and contacts across your whole team.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-[#d22624] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-[#f3ece0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-[#2a1311] text-sm font-semibold">{item.title}</p>
                  <p className="text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-[#cb7348] text-xs">
          Trusted by outreach teams at growing B2B companies.
        </p>
      </div>

      {/* Right form panel — 40% */}
      <div className="flex-1 lg:w-2/5 flex items-center justify-center bg-white px-6 py-12">
        <AuthPanel />
      </div>
    </div>
  );
}
