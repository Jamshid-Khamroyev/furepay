import { Request, Response, NextFunction } from "express";
import PaymentService from "../services/payment.service.ts";

class PaymentController {
  async createCheckoutSession(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const url = await PaymentService.createCheckoutSession(req);

      res.json({
        success: true,
        url,
      });
    } catch (err) {
      next(err);
    }
  }

  async handleWebhook(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await PaymentService.handleWebhook(req);
  
      res.sendStatus(200);
    } catch (err) {
      next(err);
    }
  }
}

export default new PaymentController();