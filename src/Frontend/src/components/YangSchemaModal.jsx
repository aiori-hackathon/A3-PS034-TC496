import { useState, useEffect } from "react";
import { X, Code2, BookOpen, Copy, Check } from "lucide-react";

export default function YangSchemaModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("yang-interfaces");
  const [schemaData, setSchemaData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/yang/schema")
        .then((res) => res.json())
        .then((data) => setSchemaData(data))
        .catch((err) => console.error("Failed to fetch YANG schema data:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getActiveContent = () => {
    if (!schemaData) return "// Loading schema specifications...";
    if (activeTab === "yang-interfaces") {
      return schemaData.yang_files?.["ietf-interfaces-telemetry.yang"] || "// YANG model not loaded";
    }
    if (activeTab === "yang-push") {
      return schemaData.yang_files?.["ietf-yang-push-telemetry.yang"] || "// YANG model not loaded";
    }
    if (activeTab === "json-schema") {
      return JSON.stringify(schemaData.schema, null, 2);
    }
    return "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                YANG Models & Schema Validation Engine
              </h3>
              <p className="text-xs text-slate-500">
                Standards-compliant YANG 1.1 definitions and RFC 7951 JSON Schema fallback engine
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

        {/* Informational Callout: Distinguishing Schema Fallback from Full YANG compiler */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-200 text-xs text-teal-900">
          <div className="font-bold mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-teal-700" />
            <span>Architecture Note: Schema-Based Validation Fallback vs. Native YANG Compiler</span>
          </div>
          <p className="text-teal-800 leading-relaxed">
            Standards-compliant native YANG compilers (e.g. <code>libyang</code>) require C-bindings and complete datastore schema trees. In this prototype, incoming telemetry messages are evaluated by a <strong>YANG-derived JSON Schema validation engine (RFC 7951)</strong>. This guarantees 100% strict enforcement of mandatory nodes, enumerations, uint data types, and non-negative boundaries while maintaining portable, zero-binary reliability.
          </p>
        </div>

        {/* Tab Selectors */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("yang-interfaces")}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === "yang-interfaces"
                  ? "border-teal-600 text-teal-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              ietf-interfaces-telemetry.yang
            </button>
            <button
              onClick={() => setActiveTab("yang-push")}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === "yang-push"
                  ? "border-teal-600 text-teal-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              ietf-yang-push-telemetry.yang
            </button>
            <button
              onClick={() => setActiveTab("json-schema")}
              className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                activeTab === "json-schema"
                  ? "border-teal-600 text-teal-700 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              RFC 7951 JSON Schema Engine
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-teal-700 font-medium pb-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
          <pre className="p-4 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 overflow-x-auto leading-relaxed shadow-xs">
            {getActiveContent()}
          </pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
