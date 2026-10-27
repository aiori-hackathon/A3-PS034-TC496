import { app } from "./server.js";
import { telemetrySimulator } from "./services/telemetrySimulator.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[YANG-Push Telemetry Pipeline] Server listening on http://localhost:${PORT}`);
});

const shutdown = () => {
  console.log("\n[YANG-Push Telemetry Pipeline] Shutting down gracefully...");
  telemetrySimulator.stopSimulation();
  if (server) {
    server.close(() => {
      console.log("[YANG-Push Telemetry Pipeline] Closed all connections.");
      process.exit(0);
    });
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
