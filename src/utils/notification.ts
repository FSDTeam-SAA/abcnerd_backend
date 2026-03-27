import { userModel } from "../modules/usersAuth/user.models";
import { NotificationModel } from "../modules/notification/notification.models";
import { NotificationType } from "../modules/notification/notification.interface";
import { getIo } from "../socket/server";

export const notifyAllUsers = async (title: string, description: string, type: NotificationType = NotificationType.SYSTEM) => {
  try {
    const users = await userModel.find({ status: "active" }).select("_id");
    const io = getIo();

    if (!users.length) return;

    const notifications = users.map((user: any) => ({
      receiverId: String(user._id),
      title,
      description,
      type,
      status: "unread",
    }));

    await NotificationModel.insertMany(notifications);

    users.forEach((user: any) => {
      // Emit only notification:new — the frontend generalNotificationStream handles all types
      io.to(String(user._id)).emit("notification:new", {
        title,
        description,
        type,
      });
    });

    console.log(`[Notification] Sent "${title}" to ${users.length} users.`);
  } catch (error) {
    console.error("[Notification Error] Failed to notify all users:", error);
  }
};

