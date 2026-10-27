import express from "express";
import cors from "cors";
import telemetryRoutes from "./routes/telemetryRoutes.js";
import simulatorRoutes from "./routes/simulatorRoutes.js";
import downstreamRoutes from "./routes/downstreamRoutes.js";
import metricsRoutes from "./routes/metricsRoutes.js";
import yangRoutes from "./routes/yangRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Handle malformed JSON body errors safely
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      status: "MALFORMED_JSON",
      message: "Malformed JSON payload: failed to parse request body."
    });
  }
  next();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    timestamp: new Date().toISOString(),
    service: "YANG-Push Telemetry Pipeline Receiver & Validator"
  });
});

// Mount Routes
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/downstream", downstreamRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/yang", yangRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error occurred.",
    error: err.message
  });
});

export { app };
export default app;
