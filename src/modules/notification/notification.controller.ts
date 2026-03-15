import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateNotification } from "./notification.interface";
import { notificationService } from "./notification.service";

//: customize as needed
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateNotification = req.body;
  const item = await notificationService.createNotification(data);
  ApiResponse.sendSuccess(res, 200, "Notification created", item);
});

//: get my all notifications user and admin
export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { notifications, meta } = await notificationService.getAllNotifications(req);
  ApiResponse.sendSuccess(res, 200, "Notifications fetched", notifications, meta);
});

//: mark notification as read, only own notifications can be marked as read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notificationId = req.params.notificationId as string;
  if (!notificationId) throw new Error("NotificationId not found");
  await notificationService.markAsRead(notificationId as string, (req as any).user._id as string);
  ApiResponse.sendSuccess(res, 200, "Notification marked as read");
});

//: delete notification only own notifications can be deleted
//delete notification
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notificationId = req.params.notificationId as string;
  if (!notificationId) throw new Error("NotificationId not found");
  await notificationService.deleteNotification(notificationId as string, (req as any).user._id as string);
  ApiResponse.sendSuccess(res, 200, "Notification deleted");
});