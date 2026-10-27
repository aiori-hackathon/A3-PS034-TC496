import { useState } from "react";
import { X, CheckCircle2, XCircle, Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";

export default function EventDetailModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const isAccepted = event.status === "ACCEPTED";
  const jsonContent = JSON.stringify(event.payload_preview || event, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            {isAccepted ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {event.message_id}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isAccepted
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {event.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Source: {event.source} · Path: {event.path} · Delay: {event.processing_delay_ms} ms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Validation Status Box */}
          {isAccepted ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Passed YANG-Push Schema Validation</span>
              </div>
              <p className="text-emerald-700">
                This message satisfied all constraints defined in RFC 8641 / RFC 8343 and was successfully routed to the downstream monitoring consumer.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Quarantined: Validation Failure Diagnosis</span>
              </div>
              <p className="text-rose-700 font-medium">
                {event.rejection_reason}
              </p>
              {event.errors && event.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-rose-200 space-y-1">
                  <div className="font-semibold text-rose-900">Schema Error Violations:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                    {event.errors.map((err, idx) => (
                      <li key={idx}>
                        <span className="font-mono text-[11px] font-semibold">{err.field}</span>: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* JSON Payload Viewer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Telemetry Payload & Properties
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 overflow-x-auto max-h-64 leading-relaxed">
              {jsonContent}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
