import { Router } from "express";
import { metricsService } from "../services/metricsService.js";
import { telemetrySimulator } from "../services/telemetrySimulator.js";

const router = Router();

/**
 * Get current pipeline metrics.
 * GET /api/metrics
 */
router.get("/", (req, res) => {
  try {
    const simulatorStatus = telemetrySimulator.getStatus();
    const metrics = metricsService.getMetrics(simulatorStatus.isRunning);
    return res.json({
      success: true,
      metrics
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
