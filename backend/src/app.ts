import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./api/api.router.js";
import { logger } from "./lib/logger.js";
import { authenticate } from "./middleware/authenticate.js";
import { adminRouter } from "./cms/admin.js";

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
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  })
);

// Mount AdminJS Headless CMS at /admin.
// We mount it BEFORE body parsers to prevent express-formidable (used by AdminJS) from hanging.
app.use("/admin", adminRouter);

// Redirect homepage root to the CMS
app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
