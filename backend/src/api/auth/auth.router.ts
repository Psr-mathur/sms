import { Router } from "express";
import { login } from "./login.js";
import { logout } from "./logout.js";
import { me } from "./me.js";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", me);
