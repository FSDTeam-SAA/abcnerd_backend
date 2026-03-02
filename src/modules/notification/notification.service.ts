import { NotificationModel } from "./notification.models";
import { ICreateNotification } from "./notification.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";

//: customize as needed

const createNotification = async (data: ICreateNotification) => {
  const item = await NotificationModel.create(data);
  return item;
};

//: get all notifications user and admin
const getAllNotifications = async (req: any) => {
  const { page: pageQuery, limit: limitQuery } = req.query;
  const { _id: userId } = req.user;

  // pagination helper
  const { page, limit, skip } = paginationHelper(pageQuery, limitQuery);


  const filter = {
    receiverId: String(userId),
  };

  const notifications = await NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

  const total = await NotificationModel.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  return {
    notifications,
    meta: {
      page,
      limit,
      totalPages,
      total,
    },
  };
};


//: mark notification as read, only own notifications can be marked as read
const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOne({ _id: notificationId, receiverId: userId }); //: check if notification belongs own
  if (!notification) throw new CustomError(404, "Notification not found");
  (notification as any).status = "read";
  await notification.save();
}

//: delete notification only own notifications can be deleted
const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOneAndDelete({ _id: notificationId, receiverId: userId }); //: check if notification belongs own
  if (!notification) throw new CustomError(404, "Notification not found");
  await notification.save();
}

//

export const notificationService = { createNotification, getAllNotifications, markAsRead, deleteNotification };
