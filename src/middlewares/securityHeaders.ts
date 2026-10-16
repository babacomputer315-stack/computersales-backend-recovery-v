import helmet from "helmet";
import { RequestHandler } from "express";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  xXssProtection: false,
});

export const xssProtectionHeader: RequestHandler = (_req, res, next) => {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
};
