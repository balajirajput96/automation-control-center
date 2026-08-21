import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { sdk } from "./sdk";
import { addAuditEvent, recordReadOnlyMaintenanceCycleForTask, recordScheduledCallbackForTask } from "../db";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/workflow-run", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const callback = await recordScheduledCallbackForTask(user.taskUid);
      if (!callback.schedule) return res.json({ ok: true, skipped: "orphan" });
      const action = callback.status === "duplicate" ? "schedule.callback_duplicate" : callback.status === "skipped" ? "schedule.callback_skipped" : "schedule.callback_blocked";
      await addAuditEvent(callback.schedule.ownerId, { action, resourceType: "schedule", resourceId: String(callback.schedule.id), outcome: callback.status === "blocked" ? "pending" : "success", detail: `Authenticated callback claimed with idempotency key ${callback.idempotencyKey}; ${callback.status === "blocked" ? "execution remains blocked until an adapter is configured." : callback.status === "duplicate" ? "duplicate delivery was not executed." : "the schedule was not active."}` });
      return res.json({ ok: true, status: callback.status === "blocked" ? "blocked_pending_execution_adapter" : callback.status, scheduleId: callback.schedule.id, idempotencyKey: callback.idempotencyKey });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "scheduled callback failed", timestamp: new Date().toISOString() });
    }
  });
  app.post("/api/scheduled/maintenance-cycle", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const cycle = await recordReadOnlyMaintenanceCycleForTask(user.taskUid);
      if (!cycle.plan) return res.json({ ok: true, skipped: "orphan" });
      await addAuditEvent(cycle.plan.ownerId, { action: `maintenance_cycle.${cycle.status}`, resourceType: "maintenance_plan", resourceId: String(cycle.plan.id), outcome: cycle.status === "completed" ? "success" : "pending", detail: `${cycle.summary} Idempotency key: ${cycle.idempotencyKey}. This callback is read-only and cannot publish, merge, deploy, delete, or change credentials.` });
      return res.json({ ok: true, status: cycle.status, maintenancePlanId: cycle.plan.id, idempotencyKey: cycle.idempotencyKey, summary: cycle.summary });
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "maintenance callback failed", timestamp: new Date().toISOString() });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
