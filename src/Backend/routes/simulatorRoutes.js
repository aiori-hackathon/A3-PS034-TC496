import { Router } from "express";
import { telemetrySimulator } from "../services/telemetrySimulator.js";

const router = Router();

/**
 * Send a single valid sample telemetry message.
 * POST /api/simulator/send-valid
 */
router.post("/send-valid", (req, res) => {
  try {
    const { message, result } = telemetrySimulator.sendSingleValid();
    return res.status(200).json({
      success: true,
      result,
      sample_message: message
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Send a single invalid sample telemetry message.
 * POST /api/simulator/send-invalid
 */
router.post("/send-invalid", (req, res) => {
  try {
    const defectType = req.body?.defectType || req.query?.defectType;
    const { message, result, defectType: actualType } = telemetrySimulator.sendSingleInvalid(defectType);
    return res.status(422).json({
      success: false,
      defect_type: actualType,
      result,
      sample_message: message
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Start continuous simulation.
 * POST /api/simulator/start
 */
router.post("/start", (req, res) => {
  try {
    const requestedInterval = Number.parseInt(req.body?.intervalMs, 10);
    const requestedFailureRate = Number.parseFloat(req.body?.failureRate);
    const intervalMs = Number.isFinite(requestedInterval) && requestedInterval > 0
      ? requestedInterval
      : 1500;
    const failureRate = Number.isFinite(requestedFailureRate)
      ? Math.min(1, Math.max(0, requestedFailureRate))
      : 0.3;
    const status = telemetrySimulator.startSimulation(intervalMs, failureRate);
    return res.json({
      success: true,
      message: `Continuous telemetry simulation started (${status.intervalMs}ms intervals, ${Math.round(status.failureRate * 100)}% invalid ratio).`,
      status
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Stop continuous simulation.
 * POST /api/simulator/stop
 */
router.post("/stop", (req, res) => {
  try {
    const status = telemetrySimulator.stopSimulation();
    return res.json({
      success: true,
      message: "Continuous telemetry simulation stopped.",
      status
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Get current simulator status.
 * GET /api/simulator/status
 */
router.get("/status", (req, res) => {
  try {
    return res.json({
      success: true,
      status: telemetrySimulator.getStatus()
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
