export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
}

export enum NotificationType {
  SYSTEM = "system",
  USER = "user",
  ADMIN = "admin",
  GOAL = "goal",
  REVIEW = "review",
  QUIZ = "quiz",
  MISSION = "mission",
  PAYMENT = "payment",
  SUBSCRIPTION = "SUBSCRIPTION",
  WORD_REVIEW = "word_review",
  AI_CHAT_MISSION = "ai_chat_mission",
  WEEKLY_QUIZ = "weekly_quiz",
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
