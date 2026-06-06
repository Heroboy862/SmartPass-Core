import express from "express";
import dotenv from "dotenv";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./app";
import { FlightAdapterHub } from "./services/flightAdapter";

dotenv.config();

const PORT = 3000;

/**
 * Vite Dev Server or Static Asset Server Entrypoint Configuration
 */
async function startServer() {
  // Start the background flight adapter adapter sync hub (Periodically polls, normalizes, writes to Firestore)
  try {
    const hub = FlightAdapterHub.getInstance();
    hub.startPolling(12000); // Polls and normalizes every 12 seconds
  } catch (err: any) {
    console.error("[StartServer] FlightAdapterHub failure:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Boarding server listening on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
