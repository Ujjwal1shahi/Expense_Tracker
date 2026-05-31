import express from 'express';
import authMiddleware from "../middleware/authMiddleware.js";
import { changePassword, getUser, updateUser } from "../controller/userController.js";

const router = express.Router();

router.get("/", authMiddleware, getUser);
router.get("/change-password", authMiddleware, changePassword);
router.get("/:id", authMiddleware, updateUser);

export default router;