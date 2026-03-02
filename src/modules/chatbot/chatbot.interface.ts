// chatbot.interface.ts

export type ChatRole = "user" | "model";

export interface IChatPart {
  text: string;
}

export interface IChatMessage {
  role: ChatRole;
  parts: IChatPart[];
}

export type ChatHistory = IChatMessage[];

// Options passed from controller → service to identify who is chatting
export interface IChatIdentity {
  userId?: string;
  sessionId?: string;
}

// Shape returned by both chat endpoints
export interface IChatResponse {
  response: string;
}