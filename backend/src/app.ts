import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./api/api.router";
import { logger } from "./lib/logger.js";
import { authenticate } from "./middleware/authenticate";

const app = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);
app.use(cookieParser());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/auth") || req.path === "/healthz") {
    return next();
  }
  return authenticate(req, res, next);
}, router);

export default app;
