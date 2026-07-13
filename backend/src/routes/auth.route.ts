import { Router } from "express"
import authController from "../controllers/auth.controller.ts"

const router = Router()

router.post('/signup', authController.signup)
router.post("/google", authController.googleLogin);
router.post('/signin', authController.signin)

export default router