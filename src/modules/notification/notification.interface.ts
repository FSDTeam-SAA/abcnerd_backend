export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
}

export enum NotificationType {
  SYSTEM = "system",
  USER = "user",
  ADMIN = "admin",
}
    
    export interface INotification {
      _id: string;

      receiverId: string;
      senderId?: string;       // optional (admin or system)

      title: string;
      description?: string;

      type: NotificationType;

      status: NotificationStatus;

      createdAt: Date;
      updatedAt: Date;
  
}

export interface ICreateNotification {
  receiverId: string;
  senderId?: string;

  title: string;
  description?: string;

  type?: NotificationType;
}
