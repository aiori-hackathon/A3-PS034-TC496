import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RefreshCw,
  Search,
  AlertTriangle,
} from "lucide-react";

export default function RecentEventsTable({
  events,
  isLoading,
  error,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  onSelectEvent,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = (events || []).filter((evt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      evt.message_id?.toLowerCase().includes(term) ||
      evt.source?.toLowerCase().includes(term) ||
      evt.rejection_reason?.toLowerCase().includes(term) ||
      evt.path?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Pipeline Event Audit Log
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Tabs */}
          <div className="inline-flex rounded-lg bg-slate-200/70 p-0.5 text-xs font-medium text-slate-600">
            {["ALL", "ACCEPTED", "REJECTED"].map((tab) => (
              <button
                key={tab}
                onClick={() => onStatusFilterChange(tab)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "All" : tab === "ACCEPTED" ? "Accepted" : "Rejected"}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID, host, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-teal-500 w-44 sm:w-56"
            />
          </div>

          {/* Manual Refresh */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh event log"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-medium">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Failed to fetch recent audit events: {error}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4">Timestamp</th>
              <th className="py-2.5 px-4">Message ID</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Source Device</th>
              <th className="py-2.5 px-4">YANG Path</th>
              <th className="py-2.5 px-4">Validation Diagnosis / Reason</th>
              <th className="py-2.5 px-4 text-right">Delay</th>
              <th className="py-2.5 px-4 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
                    <span>Loading pipeline event telemetry...</span>
                  </div>
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-slate-300" />
                    <span className="font-semibold text-slate-700">No events recorded yet</span>
                    <span className="text-xs text-slate-500 max-w-sm">
                      Use the action controls above to send a valid/invalid telemetry message or start continuous simulation.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isAccepted = evt.status === "ACCEPTED";
                return (
                  <tr
                    key={evt.event_id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-default"
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        fractionalSecondDigits: 3,
                      })}
                    </td>

                    {/* Message ID */}
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {evt.message_id}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ACCEPTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          REJECTED
                        </span>
                      )}
                    </td>

                    {/* Source Device */}
                    <td className="py-2.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {evt.source}
                    </td>

                    {/* YANG Path */}
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {evt.path}
                    </td>

                    {/* Validation Diagnosis / Rejection Reason */}
                    <td className="py-2.5 px-4 max-w-md">
                      {isAccepted ? (
                        <span className="text-emerald-700 font-medium text-xs">
                          Validated: RFC 8641 / RFC 8343 conformant
                        </span>
                      ) : (
                        <div className="flex items-start gap-1.5 text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-xs">{evt.rejection_reason}</span>
                        </div>
                      )}
                    </td>

                    {/* Processing Delay */}
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {evt.processing_delay_ms} ms
                    </td>

                    {/* Inspect Payload Button */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectEvent(evt)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 hover:text-teal-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
                        title="Inspect full JSON payload & validation metadata"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
