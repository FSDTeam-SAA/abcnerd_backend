import express from "express";
import { createSubscriptionPlan, deleteSubscriptionPlan, getAllSubscriptionPlan, getSubscriptionPlanById, updateSubscriptionPlan } from "./subscriptionplan.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createSubscriptionPlanSchema, updateSubscriptionPlanSchema } from "./subscriptionplan.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = express.Router();

//TODO: customize as needed

router.post("/create-subscriptionplan", authGuard , permission(["admin"]), validateRequest(createSubscriptionPlanSchema), createSubscriptionPlan);
router.get("/get-subscriptionplan/:subscriptionplanId", authGuard, permission(["admin", "user"]), getSubscriptionPlanById);
router.get("/get-all-subscriptionplans", authGuard, permission(["admin", "user"]), getAllSubscriptionPlan);
router.patch("/update-subscriptionplan/:subscriptionplanId", authGuard, permission(["admin"]), validateRequest(updateSubscriptionPlanSchema), updateSubscriptionPlan);
router.delete("/delete-subscriptionplan/:subscriptionplanId", authGuard, permission(["admin"]), deleteSubscriptionPlan);

export const subscriptionplanRoute = router;
