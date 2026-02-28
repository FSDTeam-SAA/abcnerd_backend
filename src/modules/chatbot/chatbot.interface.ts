export interface IChatbot {
  _id: string;
  title: string;
  description?: string;
  status?: "active" | "inactive";
  isDeleted?: boolean;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateChatbot {
  title: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface IUpdateChatbot {
  title?: string;
  description?: string;
  status?: "active" | "inactive";
}

export interface IChatbotQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "inactive";
}

export interface IChatMessage {
  message: string;
  history?: IChatHistory[];
}

export interface IChatHistory {
  role: "user" | "model";
  parts: { text: string }[];
}