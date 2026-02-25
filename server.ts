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

  // ── Phase 4 Stub Endpoints (for testing, integrate with backend later) ───────

  // Upload image (Base64 → disk)
  app.post("/api/upload-image", (req: any, res: any) => {
    const { base64, filename } = req.body;
    if (!base64 || !filename) {
      return res.status(400).json({ error: "base64 and filename required" });
    }

    // For now, just return a mock URL (would save to disk in real implementation)
    console.log(`[Upload] ${filename} (${base64.length} bytes)`);
    res.json({
      success: true,
      url: `/images/${filename}`,
      path: `/DATA/AppData/ebayos/images/${filename}`,
    });
  });

  // Get sold listings (mock data for testing)
  app.get("/api/sold-listings", (req: any, res: any) => {
    const mockSoldItems = [
      {
        itemId: "154589",
        title: "Vintage Bandai Dragon",
        startTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        soldTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        salePrice: 45.99,
      },
      {
        itemId: "154590",
        title: "Harley Davidson Collectible",
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        soldTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        salePrice: 129.50,
      },
      {
        itemId: "154591",
        title: "Rare Comic Book",
        startTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        soldTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        salePrice: 299.00,
      },
      {
        itemId: "154592",
        title: "Vintage Board Game",
        startTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        soldTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        salePrice: 65.00,
      },
    ];

    console.log("[Mock] GET /api/sold-listings");
    res.json(mockSoldItems);
  });

  // Crosslist to Poshmark (stub endpoint)
  app.post("/api/crosslist/poshmark", (req: any, res: any) => {
    const { items, extensionInstalled } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items array required" });
    }

    console.log(`[Crosslist] Posting ${items.length} items to Poshmark (stub)`);

    // Return success for each item
    const results = items.map((item: any) => ({
      itemId: item.itemId,
      success: true,
    }));

    res.json({ success: true, results });
  });

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
