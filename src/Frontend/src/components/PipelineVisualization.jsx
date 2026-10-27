import {
  Radio,
  ShieldCheck,
  Split,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function PipelineVisualization({ metrics, isSimulating }) {
  const { total_received = 0, valid_accepted = 0, invalid_rejected = 0 } = metrics || {};

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pipeline Architecture & Flow Topology</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              End-to-End Live Routing
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict isolation guarantee: Invalid payloads are quarantined at the Validator stage and cannot enter the downstream monitoring consumer.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Accepted Path
          </div>
          <div className="flex items-center gap-1.5 text-rose-700 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Rejected Quarantine
          </div>
        </div>
      </div>

      {/* Pipeline Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 relative">
        {/* Stage 1: Telemetry Simulator & Ingestion */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative group hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
              Stage 1
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSimulating ? "bg-emerald-500 animate-ping" : "bg-slate-300"
              }`}
            />
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Simulator / Receiver</div>
              <div className="text-[11px] text-slate-500">RFC 8641 YANG-Push</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Simulates periodic / on-change telemetry notifications across edge and core network routers.
          </p>
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Messages Ingested:</span>
            <span className="font-bold text-slate-900">{total_received}</span>
          </div>
        </div>

        {/* Stage 2: Schema Validator */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
              Stage 2
            </span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Schema Validator</div>
              <div className="text-[11px] text-slate-500">RFC 7951 Engine</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Validates required fields, enum states (admin/oper), integer data types, and non-negative constraints.
          </p>
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Validation Mode:</span>
            <span className="font-semibold text-teal-700">Schema Fallback</span>
          </div>
        </div>

        {/* Stage 3: Routing Split */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
              Stage 3
            </span>
            <Split className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Routing Decision</div>
              <div className="text-[11px] text-slate-500">Branching Logic</div>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Atomic routing logic strictly segregates conformant messages from invalid payloads.
          </p>
          <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between text-emerald-700 font-medium">
              <span>Valid Route:</span>
              <span>{valid_accepted} sent</span>
            </div>
            <div className="flex items-center justify-between text-rose-700 font-medium">
              <span>Quarantine Route:</span>
              <span>{invalid_rejected} routed</span>
            </div>
          </div>
        </div>

        {/* Stage 4: Split Destination Paths (Accepted vs Rejected) */}
        <div className="flex flex-col gap-2.5">
          {/* Top Branch: Downstream Consumer (Accepted) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Accepted Path
              </span>
              <span className="text-xs font-bold text-emerald-700 px-1.5 py-0.5 rounded bg-emerald-100">
                {valid_accepted}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              Downstream Consumer
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Prometheus / InfluxDB monitoring target with updated interface metrics.
            </p>
          </div>

          {/* Bottom Branch: Rejected Quarantine (Rejected) */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Quarantine Path
              </span>
              <span className="text-xs font-bold text-rose-700 px-1.5 py-0.5 rounded bg-rose-100">
                {invalid_rejected}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Dead-Letter & Audit Log
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Isolated quarantine storing detailed schema rejection diagnostics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
