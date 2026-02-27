import express from "express";
import { createPaymentIntent, createSubscriptionCheckout, successPayment, failedPayment, } from "./subscription.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createSubscriptionSchema } from "./subscription.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";

const router = express.Router();

//TODO: customize as needed

router.post("/checkout", authGuard, createSubscriptionCheckout);
router.get("/success", successPayment);
router.get("/failed", failedPayment);
router.post("/create-payment-intent", authGuard, createPaymentIntent);

export const subscriptionRoute = router;
