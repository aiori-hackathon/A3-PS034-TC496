/**
 * Downstream Consumer Service
 * 
 * Simulates a production telemetry collector (e.g., Prometheus / InfluxDB / OpenTelemetry / Grafana).
 * CRITICAL PIPELINE INVARIANT:
 * Only schema-validated messages that pass the Schema Validator reach this consumer.
 * Rejected messages are quarantined and NEVER reach this processing path.
 */

class DownstreamConsumer {
  constructor(maxStoredMessages = 200) {
    this.maxStoredMessages = maxStoredMessages;
    this.messages = [];
    this.messageIdSet = new Set();
    this.interfaceStates = new Map(); // key: `${source}:${interface_name}`
  }

  /**
   * Ingest an accepted message into the downstream telemetry consumer.
   * @param {object} message - Validated YANG-push telemetry message
   * @param {object} metadata - Ingestion metadata including processing delay
   */
  ingest(message, metadata = {}) {
    const enriched = {
      ...message,
      downstream_received_at: new Date().toISOString(),
      processing_delay_ms: metadata.processing_delay_ms || 0
    };

    // Store in circular buffer
    this.messages.unshift(enriched);
    this.messageIdSet.add(message.message_id);

    if (this.messages.length > this.maxStoredMessages) {
      const removed = this.messages.pop();
      if (removed) {
        this.messageIdSet.delete(removed.message_id);
      }
    }

    // Update real-time network interface operational table
    if (message.data && message.data.name) {
      const key = `${message.source}:${message.data.name}`;
      const prev = this.interfaceStates.get(key);

      const inOctetsDelta = prev ? Math.max(0, message.data.statistics.in_octets - prev.in_octets) : 0;
      const outOctetsDelta = prev ? Math.max(0, message.data.statistics.out_octets - prev.out_octets) : 0;

      this.interfaceStates.set(key, {
        source: message.source,
        name: message.data.name,
        type: message.data.type,
        admin_status: message.data.admin_status,
        oper_status: message.data.oper_status,
        speed_mbps: message.data.speed_mbps || 1000,
        in_octets: message.data.statistics.in_octets,
        out_octets: message.data.statistics.out_octets,
        in_octets_delta: inOctetsDelta,
        out_octets_delta: outOctetsDelta,
        in_errors: message.data.statistics.in_errors,
        out_errors: message.data.statistics.out_errors,
        last_updated: enriched.downstream_received_at,
        subscription_id: message.subscription_id
      });
    }

    return enriched;
  }

  /**
   * Check if a given message ID exists in the downstream consumer store.
   * Essential for pipeline verification.
   */
  hasMessage(messageId) {
    return this.messageIdSet.has(messageId);
  }

  /**
   * Get recent downstream messages.
   */
  getMessages(limit = 50) {
    return this.messages.slice(0, limit);
  }

  /**
   * Get active interface states table.
   */
  getInterfaceStates() {
    return Array.from(this.interfaceStates.values());
  }

  /**
   * Reset the consumer store.
   */
  reset() {
    this.messages = [];
    this.messageIdSet.clear();
    this.interfaceStates.clear();
  }
}

export const downstreamConsumer = new DownstreamConsumer();
