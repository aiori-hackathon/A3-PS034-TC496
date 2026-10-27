import crypto from "node:crypto";
import { pipelineRouter } from "./pipelineRouter.js";

const SAMPLE_ROUTERS = [
  "router-edge-01.sfo",
  "router-core-02.iad",
  "router-aggr-03.fra",
  "switch-leaf-04.tok"
];

const SAMPLE_INTERFACES = [
  { name: "GigabitEthernet0/0/0", speed: 1000 },
  { name: "GigabitEthernet0/0/1", speed: 1000 },
  { name: "TenGigE0/1/0/0", speed: 10000 },
  { name: "HundredGigE0/0/0/1", speed: 100000 }
];

let messageCounter = 1000;
let octetCounters = {
  "GigabitEthernet0/0/0": 542000000,
  "GigabitEthernet0/0/1": 128000000,
  "TenGigE0/1/0/0": 9820000000,
  "HundredGigE0/0/0/1": 42100000000
};

class TelemetrySimulator {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.intervalMs = 1500;
    this.failureRate = 0.3; // 30% invalid during continuous simulation
    this.failureAccumulator = 0;
    this.totalSimulatedSent = 0;
  }

  /**
   * Generate a realistic, valid YANG-push telemetry message.
   */
  generateValidMessage(customOverrides = {}) {
    messageCounter += 1;
    const router = SAMPLE_ROUTERS[Math.floor(Math.random() * SAMPLE_ROUTERS.length)];
    const iface = SAMPLE_INTERFACES[Math.floor(Math.random() * SAMPLE_INTERFACES.length)];

    // Increment octets realistically
    octetCounters[iface.name] = (octetCounters[iface.name] || 1000000) + Math.floor(Math.random() * 500000 + 10000);
    const inOctets = octetCounters[iface.name];
    const outOctets = Math.floor(inOctets * (0.4 + Math.random() * 0.4));
    const inPkts = Math.floor(inOctets / 1100);
    const outPkts = Math.floor(outOctets / 950);

    const message = {
      message_id: `yp-msg-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      subscription_id: 101,
      source: router,
      timestamp: new Date().toISOString(),
      path: "ietf-interfaces:interfaces/interface",
      encoding: "json_ietf",
      data: {
        name: iface.name,
        type: "iana-if-type:ethernetCsmacd",
        admin_status: "up",
        oper_status: "up",
        speed_mbps: iface.speed,
        statistics: {
          in_octets: inOctets,
          in_unicast_pkts: inPkts,
          in_discards: 0,
          in_errors: 0,
          out_octets: outOctets,
          out_unicast_pkts: outPkts,
          out_discards: 0,
          out_errors: 0
        }
      },
      ...customOverrides
    };

    return message;
  }

  /**
   * Generate an invalid telemetry message demonstrating specific schema failure scenarios.
   * @param {"missing_field" | "incorrect_type" | "invalid_enum" | "out_of_range" | "malformed_envelope"} defectType
   */
  generateInvalidMessage(defectType) {
    // Pick defect type if not specified
    const defectTypes = [
      "missing_field",
      "incorrect_type",
      "invalid_enum",
      "out_of_range",
      "malformed_envelope"
    ];
    const chosenType = defectType || defectTypes[Math.floor(Math.random() * defectTypes.length)];

    const base = this.generateValidMessage();
    base.message_id = `yp-err-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    switch (chosenType) {
      case "missing_field": {
        // Remove mandatory oper_status and in_octets
        delete base.data.oper_status;
        delete base.data.statistics.in_octets;
        break;
      }
      case "incorrect_type": {
        // String instead of integer for subscription_id, boolean for in_errors
        base.subscription_id = "SUB_INVALID_STRING_ID";
        base.data.statistics.in_errors = "ZERO_ERRORS_AS_STRING";
        break;
      }
      case "invalid_enum": {
        // oper_status has an invalid enum string not defined in RFC 8343
        base.data.oper_status = "kernel_panic_down";
        base.data.admin_status = "disabled_by_operator";
        break;
      }
      case "out_of_range": {
        // Negative counter value violates uint32 / uint64 schema constraints
        base.data.statistics.out_errors = -42;
        base.data.statistics.in_discards = -100;
        break;
      }
      case "malformed_envelope": {
        // Missing required top-level path and encoding
        delete base.path;
        base.encoding = "xml_legacy_unsupported";
        break;
      }
      default: {
        delete base.data.oper_status;
        break;
      }
    }

    return { message: base, defectType: chosenType };
  }

  /**
   * Send a single valid message through the pipeline.
   */
  sendSingleValid() {
    const message = this.generateValidMessage();
    this.totalSimulatedSent += 1;
    const result = pipelineRouter.process(message);
    return { message, result };
  }

  /**
   * Send a single invalid message through the pipeline.
   */
  sendSingleInvalid(defectType) {
    const { message, defectType: actualType } = this.generateInvalidMessage(defectType);
    this.totalSimulatedSent += 1;
    const result = pipelineRouter.process(message);
    return { message, result, defectType: actualType };
  }

  /**
   * Start continuous background simulation.
   */
  startSimulation(intervalMs = 1500, failureRate = 0.3) {
    if (this.isRunning) return this.getStatus();

    this.intervalMs = Math.max(500, intervalMs);
    this.failureRate = Math.min(1.0, Math.max(0.0, failureRate));

    // Start with an invalid event when failures are enabled, then use a
    // weighted accumulator to keep the long-run invalid ratio near failureRate.
    // Unlike independent random sampling, this avoids long all-valid streaks
    // that make the validation path hard to demonstrate in the dashboard.
    this.failureAccumulator = this.failureRate > 0 ? 1 - this.failureRate : 0;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      try {
        this.simulateNextMessage();
      } catch (err) {
        console.error("Simulation tick error:", err);
      }
    }, this.intervalMs);

    return this.getStatus();
  }

  /**
   * Generate the next simulation event through the real validation pipeline.
   * A weighted accumulator preserves the configured invalid ratio while
   * ensuring invalid events appear promptly when failureRate is greater than 0.
   */
  simulateNextMessage() {
    this.failureAccumulator += this.failureRate;

    if (this.failureRate > 0 && this.failureAccumulator >= 1) {
      this.failureAccumulator -= 1;
      return this.sendSingleInvalid();
    }

    return this.sendSingleValid();
  }

  /**
   * Stop continuous simulation.
   */
  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    return this.getStatus();
  }

  /**
   * Get current simulator status.
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      failureRate: this.failureRate,
      totalSimulatedSent: this.totalSimulatedSent
    };
  }
}

export const telemetrySimulator = new TelemetrySimulator();
