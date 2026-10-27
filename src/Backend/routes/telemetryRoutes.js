import { Router } from "express";
import { pipelineRouter } from "../services/pipelineRouter.js";
import { metricsService } from "../services/metricsService.js";
import { downstreamConsumer } from "../services/downstreamConsumer.js";

const router = Router();

/**
 * Ingest external or manual telemetry message into the pipeline.
 * POST /api/telemetry or POST /api/telemetry/publish
 */
router.post(["/", "/publish"], (req, res) => {
  try {
    const payload = req.body;
    const result = pipelineRouter.process(payload);

    if (result.status === "ACCEPTED") {
      return res.status(200).json({
        success: true,
        ...result
      });
    } else {
      return res.status(422).json({
        success: false,
        ...result
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      status: "ERROR",
      message: "Internal server error processing telemetry message.",
      error: err.message
    });
  }
});

/**
 * Query recent pipeline audit events.
 * GET /api/telemetry/events?limit=50&status=ALL|ACCEPTED|REJECTED
 */
router.get("/events", (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const status = (req.query.status || "ALL").toUpperCase();
    const events = metricsService.getEvents(limit, status);
    return res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Query quarantined rejected messages with detailed reasons.
 * GET /api/telemetry/rejected
 */
router.get("/rejected", (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const rejected = metricsService.getRejectedMessages(limit);
    return res.json({
      success: true,
      count: rejected.length,
      rejected
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Reset pipeline logs, metrics, and downstream state.
 * POST /api/telemetry/clear
 */
router.post("/clear", (req, res) => {
  try {
    metricsService.reset();
    downstreamConsumer.reset();
    return res.json({
      success: true,
      message: "Telemetry metrics, audit event logs, and downstream consumer cache cleared successfully."
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
