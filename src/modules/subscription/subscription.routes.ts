import express from "express";
import { createPaymentIntent, createSubscriptionCheckout, successPayment, failedPayment, } from "./subscription.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createSubscriptionSchema } from "./subscription.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";
import { getPaymentHistory, deletePaymentHistory } from "./subscription.controller";


const router = express.Router();

//: customize as needed

router.post("/checkout", authGuard, createSubscriptionCheckout);
router.get("/success", successPayment);
router.get("/failed", failedPayment);
router.post("/create-payment-intent", authGuard, createPaymentIntent);
router.get("/payment-history", authGuard, permission(["admin"]), getPaymentHistory);
router.delete("/payment-history/:id", authGuard, permission(["admin"]), deletePaymentHistory);


export const subscriptionRoute = router;
