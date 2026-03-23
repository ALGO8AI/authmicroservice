import { Router } from "express";
import healthcheckRouter from "./healthcheck.routes.js";
import authRouter from "./auth.routes.js";
import uploadRouter from "./upload.routes.js";
import oauthRouter from "./oauth.routes.js";

const router = Router();

router.use("/healthcheck", healthcheckRouter);
router.use("/users", authRouter);
router.use("/documents", uploadRouter);
router.use("/auth", oauthRouter);

export default router;
