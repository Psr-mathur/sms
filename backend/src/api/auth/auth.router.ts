import { Router } from "express";
import { login } from "./login";
import { logout } from "./logout";
import { me } from "./me";

export const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", me);
