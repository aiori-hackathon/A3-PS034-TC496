import { Activity, ShieldCheck, Radio, Server } from "lucide-react";

export default function Header({ isHealthy, isSimulating }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title and Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  YANG-Push Telemetry Pipeline
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  AIORI-3 Prototype
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Schema-Validated RFC 8641 / RFC 8343 Network Telemetry with Downstream Isolation
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Simulation Status Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                isSimulating
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 animate-pulse"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isSimulating ? "text-emerald-600" : "text-slate-400"}`} />
              <span>{isSimulating ? "Simulator Streaming" : "Simulator Idle"}</span>
            </div>

            {/* Validation Mode Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>RFC 7951 YANG Schema Engine</span>
            </div>

            {/* Backend Health Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border ${
                isHealthy
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <Server className={`w-3.5 h-3.5 ${isHealthy ? "text-emerald-600" : "text-rose-600"}`} />
              <span>{isHealthy ? "Backend Connected (Port 5000)" : "Backend Disconnected"}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
