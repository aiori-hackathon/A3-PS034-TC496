process.env.RUNNING_TESTS = "true";
process.env.NODE_ENV = "test";

import { test, describe, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../server.js";
import { validateTelemetryMessage } from "../services/schemaValidator.js";
import { downstreamConsumer } from "../services/downstreamConsumer.js";
import { metricsService } from "../services/metricsService.js";
import { pipelineRouter } from "../services/pipelineRouter.js";
import { telemetrySimulator } from "../services/telemetrySimulator.js";

describe("YANG-Push Telemetry Pipeline Test Suite", () => {
  let testServer;
  let baseUrl;

  beforeEach(() => {
    metricsService.reset();
    downstreamConsumer.reset();
    telemetrySimulator.stopSimulation();
  });

  // Setup test HTTP server for endpoint tests
  test("start ephemeral HTTP test server", async () => {
    await new Promise((resolve) => {
      testServer = http.createServer(app);
      testServer.listen(0, () => {
        const port = testServer.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
    assert.ok(baseUrl);
  });

  describe("1. Schema Validator Unit Tests", () => {
    test("1.1 Valid telemetry message passes validation", () => {
      const validMsg = telemetrySimulator.generateValidMessage();
      const res = validateTelemetryMessage(validMsg);
      assert.equal(res.valid, true);
      assert.equal(res.errors.length, 0);
      assert.equal(res.schema_mode, "schema-based-fallback");
    });

    test("1.2 Missing required field (oper_status) is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      delete msg.data.oper_status;
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      assert.ok(res.summary.includes("oper_status"));
      const operErr = res.errors.find((e) => e.field.includes("oper_status"));
      assert.ok(operErr, "Must report missing oper_status field");
    });

    test("1.3 Missing nested field (statistics.in_octets) is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      delete msg.data.statistics.in_octets;
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      const inOctetsErr = res.errors.find((e) => e.field.includes("in_octets"));
      assert.ok(inOctetsErr, "Must report missing in_octets field");
    });

    test("1.4 Incorrect data type (subscription_id as string) is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      msg.subscription_id = "NOT_AN_INTEGER";
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      const subErr = res.errors.find((e) => e.field === "subscription_id");
      assert.ok(subErr, "Must report incorrect data type on subscription_id");
    });

    test("1.5 Incorrect data type (in_octets as string) is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      msg.data.statistics.in_octets = "1000000_STRING";
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      const octetErr = res.errors.find((e) => e.field.includes("in_octets"));
      assert.ok(octetErr, "Must report incorrect data type on in_octets");
    });

    test("1.6 Invalid enum value in oper_status is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      msg.data.oper_status = "unrecognized_state";
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      assert.ok(res.summary.includes("unrecognized_state") || res.summary.includes("oper_status"));
    });

    test("1.7 Out-of-bounds negative value is rejected", () => {
      const msg = telemetrySimulator.generateValidMessage();
      msg.data.statistics.out_errors = -5;
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      const minErr = res.errors.find((e) => e.field.includes("out_errors"));
      assert.ok(minErr, "Must reject negative counter value");
    });

    test("1.8 Strict YANG node structure rejects unexpected fields", () => {
      const msg = telemetrySimulator.generateValidMessage();
      msg.data.unauthorized_injected_field = "bad_payload";
      const res = validateTelemetryMessage(msg);
      assert.equal(res.valid, false);
      const extraErr = res.errors.find((e) => e.field.includes("unauthorized_injected_field"));
      assert.ok(extraErr, "Must reject unauthorized property");
    });
  });

  describe("2. Pipeline Routing & Downstream Isolation Invariant", () => {
    test("2.1 Valid message reaches downstream consumer and updates metrics", () => {
      const validMsg = telemetrySimulator.generateValidMessage();
      const result = pipelineRouter.process(validMsg);

      assert.equal(result.status, "ACCEPTED");
      assert.ok(result.processing_delay_ms >= 0);

      // Verify downstream consumer HAS received the message
      assert.equal(downstreamConsumer.hasMessage(validMsg.message_id), true);
      const stored = downstreamConsumer.getMessages();
      assert.equal(stored.length, 1);
      assert.equal(stored[0].message_id, validMsg.message_id);

      // Verify metrics
      const metrics = metricsService.getMetrics();
      assert.equal(metrics.total_received, 1);
      assert.equal(metrics.valid_accepted, 1);
      assert.equal(metrics.invalid_rejected, 0);
      assert.equal(metrics.acceptance_rate, 100);
    });

    test("2.2 CRITICAL: Rejected message NEVER reaches downstream consumer", () => {
      const { message: invalidMsg } = telemetrySimulator.generateInvalidMessage("missing_field");
      const result = pipelineRouter.process(invalidMsg);

      assert.equal(result.status, "REJECTED");
      assert.ok(result.rejection_reason);

      // Verify downstream consumer DOES NOT have the message
      assert.equal(downstreamConsumer.hasMessage(invalidMsg.message_id), false);
      assert.equal(downstreamConsumer.getMessages().length, 0);

      // Verify metrics
      const metrics = metricsService.getMetrics();
      assert.equal(metrics.total_received, 1);
      assert.equal(metrics.valid_accepted, 0);
      assert.equal(metrics.invalid_rejected, 1);
      assert.equal(metrics.rejection_rate, 100);

      // Verify audit event log contains rejection reason
      const events = metricsService.getEvents();
      assert.equal(events.length, 1);
      assert.equal(events[0].status, "REJECTED");
      assert.equal(events[0].message_id, invalidMsg.message_id);
      assert.ok(events[0].rejection_reason.length > 0);

      // Verify quarantined rejected store
      const rejectedStore = metricsService.getRejectedMessages();
      assert.equal(rejectedStore.length, 1);
      assert.equal(rejectedStore[0].message_id, invalidMsg.message_id);
    });

    test("2.3 Accurate processing delay is recorded", () => {
      const validMsg = telemetrySimulator.generateValidMessage();
      pipelineRouter.process(validMsg);
      const metrics = metricsService.getMetrics();
      assert.ok(metrics.avg_processing_delay_ms >= 0);
      assert.ok(metrics.max_processing_delay_ms >= metrics.min_processing_delay_ms);
    });
  });

  describe("3. Simulator Controls", () => {
    test("3.1 Start and stop continuous simulation", () => {
      const statusStart = telemetrySimulator.startSimulation(1000, 0.2);
      assert.equal(statusStart.isRunning, true);

      const statusStop = telemetrySimulator.stopSimulation();
      assert.equal(statusStop.isRunning, false);
    });

    test("3.2 Simulator generate valid and invalid messages directly", () => {
      const validRes = telemetrySimulator.sendSingleValid();
      assert.equal(validRes.result.status, "ACCEPTED");

      const invalidRes = telemetrySimulator.sendSingleInvalid("incorrect_type");
      assert.equal(invalidRes.result.status, "REJECTED");
      assert.ok(invalidRes.result.rejection_reason.includes("subscription_id") || invalidRes.result.rejection_reason.includes("in_errors"));
    });

    test("3.3 Simulation ticks send both valid and invalid payloads through validation", () => {
      const status = telemetrySimulator.startSimulation(500, 0.3);
      assert.equal(status.isRunning, true);

      // Exercise the exact tick handler used by the background interval.
      // A 30% rate should produce both outcomes quickly and deterministically.
      const results = Array.from({ length: 5 }, () => telemetrySimulator.simulateNextMessage());
      const accepted = results.filter((entry) => entry.result.status === "ACCEPTED");
      const rejected = results.filter((entry) => entry.result.status === "REJECTED");

      assert.ok(accepted.length > 0, "Simulation must produce accepted messages");
      assert.ok(rejected.length > 0, "Simulation must produce rejected messages");
      assert.ok(rejected.every((entry) => entry.result.errors?.length > 0),
        "Every rejected simulated message must contain actual schema validation errors");

      const metrics = metricsService.getMetrics();
      assert.equal(metrics.total_received, 5);
      assert.equal(metrics.valid_accepted, accepted.length);
      assert.equal(metrics.invalid_rejected, rejected.length);

      const downstreamMessages = downstreamConsumer.getMessages();
      assert.equal(downstreamMessages.length, accepted.length);
      for (const rejectedEntry of rejected) {
        assert.equal(downstreamConsumer.hasMessage(rejectedEntry.message.message_id), false,
          "Rejected simulation messages must not reach the downstream consumer");
      }

      const rejectedEvents = metricsService.getEvents().filter((event) => event.status === "REJECTED");
      assert.equal(rejectedEvents.length, rejected.length);
      assert.ok(rejectedEvents.every((event) => event.rejection_reason),
        "Rejected simulation events must be logged with validation reasons");
    });
  });

  describe("4. API Endpoints Integration Tests", () => {
    test("4.1 GET /api/health returns healthy", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, "HEALTHY");
    });

    test("4.2 POST /api/telemetry/publish accepts valid message (HTTP 200)", async () => {
      const validMsg = telemetrySimulator.generateValidMessage();
      const res = await fetch(`${baseUrl}/api/telemetry/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validMsg)
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.status, "ACCEPTED");
      assert.equal(body.message_id, validMsg.message_id);
    });

    test("4.3 POST /api/telemetry/publish rejects invalid message (HTTP 422)", async () => {
      const { message: invalidMsg } = telemetrySimulator.generateInvalidMessage("invalid_enum");
      const res = await fetch(`${baseUrl}/api/telemetry/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidMsg)
      });
      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.status, "REJECTED");
      assert.ok(body.rejection_reason);
      assert.ok(body.errors.length > 0);
    });

    test("4.4 POST /api/simulator/send-valid endpoint works", async () => {
      const res = await fetch(`${baseUrl}/api/simulator/send-valid`, {
        method: "POST"
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.result.status, "ACCEPTED");
    });

    test("4.5 POST /api/simulator/send-invalid endpoint works", async () => {
      const res = await fetch(`${baseUrl}/api/simulator/send-invalid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defectType: "missing_field" })
      });
      assert.equal(res.status, 422);
      const body = await res.json();
      assert.equal(body.success, false);
      assert.equal(body.result.status, "REJECTED");
    });

    test("4.6 GET /api/metrics reflects accurate live counts and rates", async () => {
      await fetch(`${baseUrl}/api/simulator/send-valid`, { method: "POST" });
      const res = await fetch(`${baseUrl}/api/metrics`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.metrics.total_received, 1);
      assert.equal(body.metrics.valid_accepted, 1);
      assert.equal(body.metrics.invalid_rejected, 0);
      assert.equal(body.metrics.acceptance_rate, 100);
      assert.ok("avg_processing_delay_ms" in body.metrics);
    });

    test("4.7 GET /api/telemetry/events returns audit events with rejection reasons", async () => {
      // Send an invalid message to ensure a rejected event exists
      await fetch(`${baseUrl}/api/simulator/send-invalid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defectType: "missing_field" })
      });

      const res = await fetch(`${baseUrl}/api/telemetry/events`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(Array.isArray(body.events));
      assert.ok(body.events.length > 0);
      const rejectedEvent = body.events.find((e) => e.status === "REJECTED");
      assert.ok(rejectedEvent, "Rejected event must be present in audit logs");
      assert.ok(rejectedEvent.rejection_reason, "Rejection reason must be present");
    });

    test("4.8 GET /api/downstream/messages contains ONLY accepted messages", async () => {
      // Send a valid message and an invalid message
      await fetch(`${baseUrl}/api/simulator/send-valid`, { method: "POST" });
      await fetch(`${baseUrl}/api/simulator/send-invalid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defectType: "missing_field" })
      });

      const res = await fetch(`${baseUrl}/api/downstream/messages`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.messages.length, 1);
      for (const msg of body.messages) {
        assert.ok(!msg.message_id.startsWith("yp-err-"));
      }
    });

    test("4.9 POST /api/telemetry/clear resets all metrics and logs", async () => {
      await fetch(`${baseUrl}/api/simulator/send-valid`, { method: "POST" });
      const clearRes = await fetch(`${baseUrl}/api/telemetry/clear`, {
        method: "POST"
      });
      assert.equal(clearRes.status, 200);

      const metricsRes = await fetch(`${baseUrl}/api/metrics`);
      const metricsBody = await metricsRes.json();
      assert.equal(metricsBody.metrics.total_received, 0);
      assert.equal(metricsBody.metrics.valid_accepted, 0);
      assert.equal(metricsBody.metrics.invalid_rejected, 0);
    });

    test("4.10 GET /api/yang/schema returns YANG specifications and fallback explanation", async () => {
      const res = await fetch(`${baseUrl}/api/yang/schema`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.metadata.mode, "schema-based-fallback");
      assert.ok(body.yang_files["ietf-interfaces-telemetry.yang"]);
      assert.ok(body.yang_files["ietf-yang-push-telemetry.yang"]);
    });
  });

  after(() => {
    telemetrySimulator.stopSimulation();
    if (testServer) {
      testServer.close();
    }
  });
});
