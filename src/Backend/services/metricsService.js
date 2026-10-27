/**
 * Metrics and Event Logging Service
 * 
 * Accurately tracks message counts, rates, real measured processing delays,
 * and maintains audit event logs.
 */

class MetricsService {
  constructor(maxEvents = 150, maxRejected = 100) {
    this.maxEvents = maxEvents;
    this.maxRejected = maxRejected;
    this.reset();
  }

  reset() {
    this.total_received = 0;
    this.valid_accepted = 0;
    this.invalid_rejected = 0;
    this.total_delay_ms = 0;
    this.delay_count = 0;
    this.min_delay_ms = null;
    this.max_delay_ms = null;
    this.events = [];
    this.rejected_messages = [];
  }

  /**
   * Record processing delay in milliseconds.
   * Only called with real measured timings.
   */
  recordDelay(delayMs) {
    if (typeof delayMs !== "number" || isNaN(delayMs) || delayMs < 0) return;
    this.total_delay_ms += delayMs;
    this.delay_count += 1;
    if (this.min_delay_ms === null || delayMs < this.min_delay_ms) {
      this.min_delay_ms = delayMs;
    }
    if (this.max_delay_ms === null || delayMs > this.max_delay_ms) {
      this.max_delay_ms = delayMs;
    }
  }

  /**
   * Record an accepted message event.
   */
  recordAccepted(eventData) {
    this.total_received += 1;
    this.valid_accepted += 1;
    this.recordDelay(eventData.processing_delay_ms);

    const event = {
      event_id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      message_id: eventData.message_id || "unknown",
      status: "ACCEPTED",
      source: eventData.source || "unknown",
      path: eventData.path || "ietf-interfaces:interfaces",
      rejection_reason: null,
      errors: [],
      processing_delay_ms: Math.round(eventData.processing_delay_ms * 1000) / 1000,
      payload_preview: eventData.payload_preview || {}
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    return event;
  }

  /**
   * Record a rejected message event.
   */
  recordRejected(eventData) {
    this.total_received += 1;
    this.invalid_rejected += 1;
    this.recordDelay(eventData.processing_delay_ms);

    const event = {
      event_id: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      message_id: eventData.message_id || "unknown",
      status: "REJECTED",
      source: eventData.source || "unknown",
      path: eventData.path || "unknown",
      rejection_reason: eventData.rejection_reason || "Schema validation failure",
      errors: eventData.errors || [],
      processing_delay_ms: Math.round(eventData.processing_delay_ms * 1000) / 1000,
      payload_preview: eventData.payload_preview || {}
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    // Add to separate rejected quarantine store
    this.rejected_messages.unshift({
      quarantine_timestamp: event.timestamp,
      message_id: event.message_id,
      rejection_reason: event.rejection_reason,
      errors: event.errors,
      raw_payload: eventData.raw_payload || eventData.payload_preview
    });
    if (this.rejected_messages.length > this.maxRejected) {
      this.rejected_messages.pop();
    }

    return event;
  }

  /**
   * Get current aggregate metrics.
   */
  getMetrics(isSimulatorRunning = false) {
    const total = this.total_received;
    const accepted = this.valid_accepted;
    const rejected = this.invalid_rejected;

    const acceptance_rate = total > 0 ? Math.round((accepted / total) * 1000) / 10 : 0;
    const rejection_rate = total > 0 ? Math.round((rejected / total) * 1000) / 10 : 0;

    const avg_delay_ms = this.delay_count > 0 
      ? Math.round((this.total_delay_ms / this.delay_count) * 1000) / 1000 
      : 0;

    return {
      total_received: total,
      valid_accepted: accepted,
      invalid_rejected: rejected,
      acceptance_rate,
      rejection_rate,
      avg_processing_delay_ms: avg_delay_ms,
      min_processing_delay_ms: this.min_delay_ms !== null ? Math.round(this.min_delay_ms * 1000) / 1000 : 0,
      max_processing_delay_ms: this.max_delay_ms !== null ? Math.round(this.max_delay_ms * 1000) / 1000 : 0,
      simulator_running: Boolean(isSimulatorRunning)
    };
  }

  /**
   * Get recent event logs with optional status filter.
   */
  getEvents(limit = 50, statusFilter = "ALL") {
    let list = this.events;
    if (statusFilter && statusFilter !== "ALL") {
      list = list.filter((e) => e.status === statusFilter.toUpperCase());
    }
    return list.slice(0, limit);
  }

  /**
   * Get quarantined rejected messages.
   */
  getRejectedMessages(limit = 50) {
    return this.rejected_messages.slice(0, limit);
  }
}

export const metricsService = new MetricsService();
