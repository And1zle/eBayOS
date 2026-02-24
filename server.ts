import express from "express";
import https from "https";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project dir regardless of CWD (preview tool starts from C:\)
dotenv.config({ path: path.join(__dirname, ".env") });
const PORT = parseInt(process.env.PORT || "3000");

// All real logic lives in the Docker backend on the CasaOS server.
// This server just proxies /api/* → backend and serves the Vite frontend.
const BACKEND_URL = process.env.BACKEND_URL || "http://100.67.134.63:5000";

async function startServer() {
  const app = express();

  // Must be large enough for base64 images (~12MB image → ~16MB base64)
  app.use(express.json({ limit: "50mb" }));

  // ── Proxy all /api/* → Docker backend ─────────────────────────────────────
  app.use("/api", async (req: any, res: any) => {
    const targetUrl = BACKEND_URL + req.originalUrl;
    console.log(`[Proxy] ${req.method} ${targetUrl}`);

    try {
      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
          "content-type": req.headers["content-type"] || "application/json",
        },
        timeout: 60000, // 60s for image analysis
      });
      res.status(response.status).json(response.data);
    } catch (err: any) {
      const status = err.response?.status || 502;
      const data = err.response?.data || { error: err.message };
      console.error(`[Proxy Error] ${req.method} ${targetUrl}:`, err.message);
      res.status(status).json(data);
    }
  });

  // ── Vite Middleware (dev) or Static (prod) ─────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: __dirname,           // Explicitly set root to project dir, not CWD
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req: any, res: any) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Use HTTPS in production if cert files exist (generated during Docker build)
  const certPath = path.join(__dirname, "cert.pem");
  const keyPath = path.join(__dirname, "key.pem");
  if (process.env.NODE_ENV === "production" && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    https.createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
      .listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 eBayOS running on https://localhost:${PORT}`);
        console.log(`🔌 Proxying /api/* → ${BACKEND_URL}`);
      });
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 eBayOS running on http://localhost:${PORT}`);
      console.log(`🔌 Proxying /api/* → ${BACKEND_URL}`);
    });
  }
}

startServer();
