export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
}

export enum NotificationType {
  SYSTEM = "system",
  USER = "user",
  ADMIN = "admin",
  GOAL_ACHIEVED = "goal_achieved",
  WORD_REVIEW = "word_review",
  WEEKLY_QUIZ = "weekly_quiz",
  AI_CHAT_MISSION = "ai_chat_mission",
  SUBSCRIPTION = "subscription"
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
