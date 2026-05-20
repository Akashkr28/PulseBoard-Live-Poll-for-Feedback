import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import http from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter, authLimiter, responseLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./routes/auth.routes.js";
import pollRoutes from "./routes/poll.routes.js";
import publicRoutes from "./routes/public.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;
app.set("trust proxy", 1);

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use((req, _res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  socket.on("poll:join", (publicId) => {
    if (typeof publicId === "string" && publicId.trim()) {
      socket.join(`poll:${publicId}`);
    }
  });

  socket.on("poll:leave", (publicId) => {
    if (typeof publicId === "string" && publicId.trim()) {
      socket.leave(`poll:${publicId}`);
    }
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "PulseBoard API" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "PulseBoard API",
    status: "ok",
    health: "/api/health"
  });
});

app.use("/api", apiLimiter);
app.use(["/api/auth/login", "/api/auth/register"], authLimiter);
app.use("/api/public/polls/:publicId/responses", responseLimiter);
app.use(csrfProtection);
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/public/polls", publicRoutes);
app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`PulseBoard API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Could not start server:", error.message);
    process.exit(1);
  });
