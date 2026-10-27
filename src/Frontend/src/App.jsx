import { useState, useEffect, useCallback } from "react";
import Header from "./components/Header";
import MetricCards from "./components/MetricCards";
import PipelineVisualization from "./components/PipelineVisualization";
import ActionControls from "./components/ActionControls";
import RecentEventsTable from "./components/RecentEventsTable";
import DownstreamConsumerView from "./components/DownstreamConsumerView";
import EventDetailModal from "./components/EventDetailModal";
import YangSchemaModal from "./components/YangSchemaModal";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function App() {
  const [metrics, setMetrics] = useState({
    total_received: 0,
    valid_accepted: 0,
    invalid_rejected: 0,
    acceptance_rate: 0,
    rejection_rate: 0,
    avg_processing_delay_ms: 0,
    min_processing_delay_ms: 0,
    max_processing_delay_ms: 0,
    simulator_running: false,
  });

  const [events, setEvents] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [isHealthy, setIsHealthy] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isYangModalOpen, setIsYangModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [activeTab, setActiveTab] = useState("events");
  const [toast, setToast] = useState(null);

  const showToast = (type, title, detail = "") => {
    setToast({ type, title, detail });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 4500);
  };

  const loadData = useCallback(async (currentFilter = statusFilter) => {
    try {
      const [healthRes, metricsRes, eventsRes, ifaceRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/metrics"),
        fetch(`/api/telemetry/events?limit=100&status=${currentFilter}`),
        fetch("/api/downstream/interfaces"),
      ]);

      setIsHealthy(healthRes.ok);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.metrics) {
          setMetrics(metricsData.metrics);
          setIsSimulating(metricsData.metrics.simulator_running);
        }
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData.events || []);
        setEventsError(null);
      } else {
        setEventsError(`HTTP ${eventsRes.status}: Failed to load events`);
      }

      if (ifaceRes.ok) {
        const ifaceData = await ifaceRes.json();
        setInterfaces(ifaceData.interfaces || []);
      }
    } catch (err) {
      setIsHealthy(false);
      setEventsError(err.message);
    }
  }, [statusFilter]);

  // Periodic polling every 1.5 seconds
  useEffect(() => {
    let isCancelled = false;

    const executePoll = async () => {
      if (!isCancelled) {
        await loadData(statusFilter);
      }
    };

    executePoll();
    const interval = setInterval(executePoll, 1500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [loadData, statusFilter]);

  // Handle action: Send Valid Message
  const handleSendValid = async () => {
    setLoadingAction("send-valid");
    try {
      const res = await fetch("/api/simulator/send-valid", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          "success",
          `Message ${data.sample_message?.message_id} Accepted`,
          `Validated in ${data.result?.processing_delay_ms} ms and routed to downstream consumer.`
        );
        await loadData(statusFilter);
      } else {
        showToast("error", "Validation Error", data.message || "Failed to process message.");
      }
    } catch (err) {
      showToast("error", "Network Error", err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle action: Send Invalid Message
  const handleSendInvalid = async (defectType) => {
    setLoadingAction("send-invalid");
    try {
      const res = await fetch("/api/simulator/send-invalid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defectType }),
      });
      const data = await res.json();
      if (res.status === 422 || !data.success) {
        showToast(
          "error",
          `Message ${data.sample_message?.message_id || ""} Quarantined`,
          data.result?.rejection_reason || "Message failed schema validation as expected."
        );
        await loadData(statusFilter);
      }
    } catch (err) {
      showToast("error", "Network Error", err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle action: Start Simulation
  const handleStartSimulation = async () => {
    setLoadingAction("start-sim");
    try {
      const res = await fetch("/api/simulator/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMs: 1500, failureRate: 0.3 }),
      });
      if (res.ok) {
        setIsSimulating(true);
        showToast("success", "Simulation Started", "Streaming telemetry notifications at 1.5s intervals (30% defect ratio).");
        await loadData(statusFilter);
      }
    } catch (err) {
      showToast("error", "Failed to Start Simulation", err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle action: Stop Simulation
  const handleStopSimulation = async () => {
    setLoadingAction("stop-sim");
    try {
      const res = await fetch("/api/simulator/stop", { method: "POST" });
      if (res.ok) {
        setIsSimulating(false);
        showToast("info", "Simulation Stopped", "Continuous telemetry stream paused.");
        await loadData(statusFilter);
      }
    } catch (err) {
      showToast("error", "Failed to Stop Simulation", err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Handle action: Clear Logs
  const handleClearLogs = async () => {
    setLoadingAction("clear-logs");
    try {
      const res = await fetch("/api/telemetry/clear", { method: "POST" });
      if (res.ok) {
        showToast("info", "Logs Cleared", "Metrics counters, audit events, and downstream store reset.");
        await loadData(statusFilter);
      }
    } catch (err) {
      showToast("error", "Clear Failed", err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 bg-white ${
              toast.type === "success"
                ? "border-emerald-300 text-slate-900"
                : toast.type === "error"
                ? "border-rose-300 text-slate-900"
                : "border-slate-300 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              {toast.type === "error" && (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="text-sm font-bold">{toast.title}</div>
                {toast.detail && (
                  <div className="text-xs text-slate-600 mt-0.5">{toast.detail}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header isHealthy={isHealthy} isSimulating={isSimulating} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Cards Row */}
        <section>
          <MetricCards metrics={metrics} />
        </section>

        {/* Action Controls Row */}
        <section>
          <ActionControls
            onSendValid={handleSendValid}
            onSendInvalid={handleSendInvalid}
            onStartSimulation={handleStartSimulation}
            onStopSimulation={handleStopSimulation}
            onClearLogs={handleClearLogs}
            onOpenYangSchema={() => setIsYangModalOpen(true)}
            isSimulating={isSimulating}
            loadingAction={loadingAction}
          />
        </section>

        {/* Pipeline Architecture Visualization */}
        <section>
          <PipelineVisualization metrics={metrics} isSimulating={isSimulating} />
        </section>

        {/* View Selection Tabs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-4 text-sm font-semibold">
              <button
                onClick={() => setActiveTab("events")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer ${
                  activeTab === "events"
                    ? "border-teal-600 text-teal-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Event Audit Log ({events.length})
              </button>
              <button
                onClick={() => setActiveTab("downstream")}
                className={`pb-3 px-1 border-b-2 transition-all cursor-pointer ${
                  activeTab === "downstream"
                    ? "border-teal-600 text-teal-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Downstream Monitored State ({interfaces.length} Interfaces)
              </button>
            </div>
          </div>

          {/* Active Tab Panel */}
          {activeTab === "events" ? (
            <RecentEventsTable
              events={events}
              isLoading={isLoadingEvents}
              error={eventsError}
              statusFilter={statusFilter}
              onStatusFilterChange={(f) => {
                setStatusFilter(f);
                setIsLoadingEvents(true);
                loadData(f).finally(() => setIsLoadingEvents(false));
              }}
              onRefresh={() => {
                setIsLoadingEvents(true);
                loadData(statusFilter).finally(() => setIsLoadingEvents(false));
              }}
              onSelectEvent={(e) => setSelectedEvent(e)}
            />
          ) : (
            <DownstreamConsumerView
              interfaces={interfaces}
              acceptedMessagesCount={metrics.valid_accepted}
            />
          )}
        </section>
      </main>

      {/* Modals */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <YangSchemaModal
        isOpen={isYangModalOpen}
        onClose={() => setIsYangModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AIORI-3 Hackathon Prototype: Schema-Validated YANG-Push Telemetry Pipeline
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            RFC 8641 · RFC 8343 · RFC 7951 Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
