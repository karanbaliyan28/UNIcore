import express from "express";
import { login, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", (req, res) => res.render("login", { error: null }));
router.post("/login", login);
router.get("/logout", logout);

export default router;
