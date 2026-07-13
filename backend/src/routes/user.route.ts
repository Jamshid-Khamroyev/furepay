import { Router } from "express";
import userController from "../controllers/user.controller.ts";
import authMiddleware from "../middleware/auth.midlewere.ts";

const router = Router();

router.get("/me", authMiddleware.user, userController.getMe);
router.patch("/me", authMiddleware.user, userController.updateMe);
router.patch("/:id/block", authMiddleware.admin, userController.blockUser);
router.get("/all", authMiddleware.admin, userController.allUsers);
router.post("/logout", authMiddleware.user, userController.logout);
router.get("/:userId", authMiddleware.user, userController.userProfile);

export default router;