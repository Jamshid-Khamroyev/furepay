import { Request } from "express";
import { stripe } from "../config/stripe";
import { prisma } from "../config/db";
import Stripe from "stripe";

class PaymentService {
  async createCheckoutSession(req: Request) {
    const user = req.user!;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      success_url:
        `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${process.env.CLIENT_URL}/profile`,

      metadata: {
        userId: user.userId,
      },
    });

    return session.url;
  }

  async handleWebhook(req: Request) {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      throw new Error("Stripe signature not found.");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      throw new Error(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;

        if (!userId) {
          throw new Error("User ID not found in metadata.");
        }

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            plan: "PREMIUM",
          },
        });

        console.log(`✅ User ${userId} upgraded to PRO`);
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  }
}

export default new PaymentService();