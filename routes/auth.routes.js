import express from "express";
import { loginAdmin, logout } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", (req, res) => res.render("login", { error: null }));
router.post("/login", loginAdmin);
router.get("/logout", logout);

export default router;
