import { validateTelemetryMessage, YANG_VALIDATION_METADATA } from "./schemaValidator.js";
import { downstreamConsumer } from "./downstreamConsumer.js";
import { metricsService } from "./metricsService.js";

/**
 * Pipeline Router: Orchestrates schema validation, routing, metrics, and downstream ingestion.
 */
export class PipelineRouter {
  /**
   * Process an incoming telemetry message through the validation and routing pipeline.
   * @param {any} message - Candidate telemetry message payload
   * @returns {{ status: "ACCEPTED" | "REJECTED", message_id: string, processing_delay_ms: number, rejection_reason?: string, errors?: Array<any>, schema_mode: string }}
   */
  process(message) {
    const startTimeHr = process.hrtime.bigint();

    // 1. Message ID extraction or fallback
    const messageId = (message && typeof message === "object" && message.message_id)
      ? String(message.message_id)
      : `malformed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const source = (message && typeof message === "object" && message.source) ? String(message.source) : "unknown";
    const path = (message && typeof message === "object" && message.path) ? String(message.path) : "unknown";

    // 2. Schema Validation
    const validationResult = validateTelemetryMessage(message);

    // High resolution processing delay calculation in milliseconds
    const endTimeHr = process.hrtime.bigint();
    const processingDelayMs = Number(endTimeHr - startTimeHr) / 1_000_000;

    const payloadPreview = (message && typeof message === "object") ? {
      name: message.data?.name,
      oper_status: message.data?.oper_status,
      admin_status: message.data?.admin_status,
      speed_mbps: message.data?.speed_mbps,
      in_octets: message.data?.statistics?.in_octets,
      out_octets: message.data?.statistics?.out_octets
    } : {};

    // 3. Routing
    if (validationResult.valid) {
      // ACCEPTED ROUTE: Pass message to downstream consumer
      downstreamConsumer.ingest(message, {
        processing_delay_ms: processingDelayMs
      });

      // Record accepted event and metrics
      metricsService.recordAccepted({
        message_id: messageId,
        source,
        path,
        processing_delay_ms: processingDelayMs,
        payload_preview: payloadPreview
      });

      return {
        status: "ACCEPTED",
        message_id: messageId,
        processing_delay_ms: Math.round(processingDelayMs * 1000) / 1000,
        schema_mode: validationResult.schema_mode,
        message: "Message conforms to YANG-push schema and was routed downstream."
      };
    } else {
      // REJECTED ROUTE:
      // Invariant: rejected messages NEVER reach downstreamConsumer!
      metricsService.recordRejected({
        message_id: messageId,
        source,
        path,
        rejection_reason: validationResult.summary,
        errors: validationResult.errors,
        processing_delay_ms: processingDelayMs,
        payload_preview: payloadPreview,
        raw_payload: message
      });

      return {
        status: "REJECTED",
        message_id: messageId,
        rejection_reason: validationResult.summary,
        errors: validationResult.errors,
        processing_delay_ms: Math.round(processingDelayMs * 1000) / 1000,
        schema_mode: validationResult.schema_mode
      };
    }
  }
}

export const pipelineRouter = new PipelineRouter();
