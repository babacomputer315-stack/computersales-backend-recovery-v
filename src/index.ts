import "dotenv/config";
import express from "express";
import cors from "cors";
import adminRoutes from "./routes/admin/index.route";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user/index.route";
import { errorHandler } from "./middlewares/errorHandler";
import {
  securityHeaders,
  xssProtectionHeader,
} from "./middlewares/securityHeaders";
import emallsRoutes from "./routes/emalls.routes";
import torobRoutes from "./routes/torob.routes";

const app = express();

// Readiness endpoint for isolated deployment checks. It deliberately does not
// query or mutate the database, so it is safe to use as a platform health check.
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "computersales-backend",
    timestamp: new Date().toISOString(),
  });
});
app.use(securityHeaders);
app.use(xssProtectionHeader);
app.use(express.json());
app.use(cors());

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/list", emallsRoutes);
app.use("/torob", torobRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
