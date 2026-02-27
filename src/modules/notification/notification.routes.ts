import express from "express";
import { createNotification, deleteNotification, getMyNotifications, markAsRead } from "./notification.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createNotificationSchema } from "./notification.validation";
import { uploadSingle } from "../../middleware/multer.midleware";
import { authGuard } from "../../middleware/auth.middleware";
import { permission } from "../../middleware/permission.middleware";

const router = express.Router();

//TODO: customize as needed

// router.post("/create-notification",  validateRequest(createNotificationSchema), createNotification); //!only system can create notifications, so no need of validation and multer
router.get("/my-notifications", authGuard, permission(["admin", "user"]), getMyNotifications);
router.patch("/mark-as-read/:notificationId", authGuard, permission(["admin", "user"]), markAsRead);
router.delete("/delete-notification/:notificationId", authGuard, permission(["admin", "user"]), deleteNotification);

export const notificationRoute = router;
