import express from "express";
import helmet from "helmet";
import { apiLimiter, aiLimiter } from "./middleware/rateLimit";
import simulatedRouter from "./routes/simulation";
import boardingPassRouter from "./routes/boardingPass";
import assistantRouter from "./routes/assistant";
import transportRouter from "./routes/transport";
import currencyRouter from "./routes/currency";
import emailRouter from "./routes/email";
import passengerRouter from "./routes/passenger";

const app = express();

// Enable 'trust proxy' so Express registers client IPs correctly from the reverse proxy (X-Forwarded-For)
app.set("trust proxy", 1);

// Apply Helmet.js to automatically configure secure HTTP headers (protect against Clickjacking, basic XSS, Sniffing)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "https://apis.google.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'", 
          "data:", 
          "https://api.qrserver.com", 
          "https://images.unsplash.com", 
          "https://*.unsplash.com", 
          "https://*.googleapis.com"
        ],
        connectSrc: [
          "'self'", 
          "https://*.googleapis.com", 
          "https://*.firebaseio.com", 
          "https://*.firestore.googleapis.com",
          "wss://*.firebaseio.com",
          "wss://*.firestore.googleapis.com",
          "ws:", 
          "wss:"
        ],
        frameAncestors: [
          "'self'", 
          "https://*.run.app", 
          "https://ai.studio", 
          "https://*.google.com"
        ]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(express.json());

/**
 * REST API Routing Registrations
 */
app.use("/api/simulation", apiLimiter, simulatedRouter);
app.use("/api/parse-boarding-pass", apiLimiter, boardingPassRouter);
app.use("/api/assistant", aiLimiter, assistantRouter);
app.use("/api/transport", apiLimiter, transportRouter);
app.use("/api/authority", apiLimiter, transportRouter); // Re-uses transport router for the nested /stream endpoint
app.use("/api/currency", apiLimiter, currencyRouter);
app.use("/api/email", apiLimiter, emailRouter);
app.use("/api", apiLimiter, passengerRouter);

export default app;
