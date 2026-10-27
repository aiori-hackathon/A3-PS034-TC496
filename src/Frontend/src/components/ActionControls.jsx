import { useState } from "react";
import {
  CheckCircle,
  AlertOctagon,
  Play,
  Square,
  Trash2,
  ChevronDown,
  Loader2,
  Code2,
} from "lucide-react";

export default function ActionControls({
  onSendValid,
  onSendInvalid,
  onStartSimulation,
  onStopSimulation,
  onClearLogs,
  onOpenYangSchema,
  isSimulating,
  loadingAction,
}) {
  const [defectType, setDefectType] = useState("missing_field");

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Message Ingestion Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Send Valid Message */}
          <button
            onClick={onSendValid}
            disabled={loadingAction !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loadingAction === "send-valid" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>Send Valid Message</span>
          </button>

          {/* Send Invalid Message with Defect Type Selector */}
          <div className="inline-flex items-center rounded-lg shadow-xs">
            <button
              onClick={() => onSendInvalid(defectType)}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-l-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loadingAction === "send-invalid" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertOctagon className="w-4 h-4" />
              )}
              <span>Send Invalid Message</span>
            </button>
            <div className="relative border-l border-rose-500">
              <select
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                disabled={loadingAction !== null}
                className="appearance-none bg-rose-700 hover:bg-rose-800 text-white text-xs font-medium py-2.5 pl-2.5 pr-7 rounded-r-lg cursor-pointer focus:outline-none"
              >
                <option value="missing_field">Missing oper_status</option>
                <option value="incorrect_type">Incorrect Data Type</option>
                <option value="invalid_enum">Invalid Enum State</option>
                <option value="out_of_range">Negative Counter Value</option>
                <option value="malformed_envelope">Missing YANG Path</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/80 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Simulation & System Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Continuous Simulation Controls */}
          {isSimulating ? (
            <button
              onClick={onStopSimulation}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {loadingAction === "stop-sim" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4 fill-white" />
              )}
              <span>Stop Simulation</span>
            </button>
          ) : (
            <button
              onClick={onStartSimulation}
              disabled={loadingAction !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              {loadingAction === "start-sim" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>Start Simulation</span>
            </button>
          )}

          {/* View YANG Schema & Models */}
          <button
            onClick={onOpenYangSchema}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-teal-600" />
            <span>YANG & Schema Specs</span>
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            disabled={loadingAction !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
            title="Reset all audit events, metrics, and downstream caches"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
}
