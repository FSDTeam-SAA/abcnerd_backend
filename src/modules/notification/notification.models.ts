import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { INotification, NotificationStatus, NotificationType } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    receiverId: { type: String, required: true },
    senderId: { type: String },

    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.SYSTEM  ,
    },

    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.UNREAD,
    },

  },
  { timestamps: true }
);


export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);