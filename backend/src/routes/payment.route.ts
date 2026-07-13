import { Router } from "express";
import  authenticate from "../middleware/auth.midlewere.ts";
import PaymentController from "../controllers/payment.controller.ts";

const router = Router();

router.post("/checkout", authenticate.user, PaymentController.createCheckoutSession);
router.post(
    "/webhook",
    PaymentController.handleWebhook
  );
export default router;