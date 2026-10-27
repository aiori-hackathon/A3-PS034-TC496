import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { YANG_VALIDATION_METADATA, yangPushTelemetrySchema } from "../yang/schema.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Return YANG schema metadata, RFC references, and model specifications.
 * GET /api/yang/schema
 */
router.get("/schema", (req, res) => {
  try {
    const yangDir = path.resolve(__dirname, "../yang");
    let interfacesYang = "";
    let pushYang = "";

    try {
      interfacesYang = fs.readFileSync(path.join(yangDir, "ietf-interfaces-telemetry.yang"), "utf-8");
      pushYang = fs.readFileSync(path.join(yangDir, "ietf-yang-push-telemetry.yang"), "utf-8");
    } catch {
      // Fallback if file reading fails
    }

    return res.json({
      success: true,
      metadata: YANG_VALIDATION_METADATA,
      schema: yangPushTelemetrySchema,
      yang_files: {
        "ietf-interfaces-telemetry.yang": interfacesYang,
        "ietf-yang-push-telemetry.yang": pushYang
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

export default router;
