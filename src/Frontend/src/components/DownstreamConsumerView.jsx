import { Database, ArrowUp, ArrowDown } from "lucide-react";

export default function DownstreamConsumerView({ interfaces, acceptedMessagesCount }) {
  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Downstream Telemetry Consumer</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Validated Only
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated network operational states populated exclusively by schema-validated YANG notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
            {acceptedMessagesCount} messages consumed
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-4">Monitored Device</th>
              <th className="py-2.5 px-4">Interface Name</th>
              <th className="py-2.5 px-4">Admin State</th>
              <th className="py-2.5 px-4">Oper State</th>
              <th className="py-2.5 px-4">Link Bandwidth</th>
              <th className="py-2.5 px-4">Traffic In (Octets)</th>
              <th className="py-2.5 px-4">Traffic Out (Octets)</th>
              <th className="py-2.5 px-4">Last Ingested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(!interfaces || interfaces.length === 0) ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database className="w-8 h-8 text-slate-300" />
                    <span className="font-semibold text-slate-700">Downstream store is currently empty</span>
                    <span className="text-xs text-slate-500">
                      Send a valid message or start the simulator to feed validated telemetry downstream.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              interfaces.map((iface) => (
                <tr key={`${iface.source}:${iface.name}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {iface.source}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-medium text-teal-800">
                    {iface.name}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {iface.admin_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {iface.oper_status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {iface.speed_mbps ? `${(iface.speed_mbps / 1000).toFixed(0)} Gbps` : "N/A"}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-emerald-600" />
                      <span>{formatBytes(iface.in_octets)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-700">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-sky-600" />
                      <span>{formatBytes(iface.out_octets)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    {new Date(iface.last_updated).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
