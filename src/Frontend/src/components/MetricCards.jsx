import { Inbox, CheckCircle2, XCircle, Percent, Timer } from "lucide-react";

export default function MetricCards({ metrics }) {
  const {
    total_received = 0,
    valid_accepted = 0,
    invalid_rejected = 0,
    acceptance_rate = 0,
    rejection_rate = 0,
    avg_processing_delay_ms = 0,
    min_processing_delay_ms = 0,
    max_processing_delay_ms = 0,
  } = metrics || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Messages Received */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Received
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Inbox className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {total_received.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Ingested telemetry messages
          </div>
        </div>
      </div>

      {/* 2. Valid Messages Accepted */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-emerald-200 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valid Accepted
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {valid_accepted.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">
            Passed schema validation
          </div>
        </div>
      </div>

      {/* 3. Invalid Messages Rejected */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-rose-200 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Invalid Rejected
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-rose-700 tracking-tight">
            {invalid_rejected.toLocaleString()}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-0.5">
            Quarantined from downstream
          </div>
        </div>
      </div>

      {/* 4. Acceptance / Rejection Rate */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Acceptance Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {acceptance_rate}%
            </div>
            {total_received > 0 && (
              <span className="text-xs text-rose-600 font-medium">
                ({rejection_rate}% rejected)
              </span>
            )}
          </div>
          {/* Progress split bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 flex overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 transition-all duration-300"
              style={{ width: `${acceptance_rate}%` }}
            />
            <div
              className="bg-rose-500 h-1.5 transition-all duration-300"
              style={{ width: `${rejection_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 5. Processing Delay */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Avg Processing Delay
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {avg_processing_delay_ms} <span className="text-sm font-semibold text-slate-500">ms</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {total_received > 0 ? (
              <span>Min: {min_processing_delay_ms}ms · Max: {max_processing_delay_ms}ms</span>
            ) : (
              <span>High-resolution timing</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
