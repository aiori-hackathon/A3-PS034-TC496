import { Router } from "express";
import { downstreamConsumer } from "../services/downstreamConsumer.js";

const router = Router();

/**
 * Get downstream received messages (accepted messages only).
 * GET /api/downstream/messages
 */
router.get("/messages", (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const messages = downstreamConsumer.getMessages(limit);
    return res.json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/**
 * Get aggregated active network interface states table.
 * GET /api/downstream/interfaces
 */
router.get("/interfaces", (req, res) => {
  try {
    const interfaces = downstreamConsumer.getInterfaceStates();
    return res.json({
      success: true,
      count: interfaces.length,
      interfaces
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
