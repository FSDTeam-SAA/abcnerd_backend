// chatHistory.model.ts
import mongoose, { Schema, Types } from "mongoose";

type Role = "user" | "model";

export interface IChatPart {
    text: string;
}

export interface IChatItem {
    role: Role;
    parts: IChatPart[];
    createdAt?: Date;
}

export interface IDailyChatHistory extends mongoose.Document {
    userId?: Types.ObjectId;
    sessionId?: string;
    dayKey: string; // YYYY-MM-DD
    messages: IChatItem[];
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const chatItemSchema = new Schema<IChatItem>(
    {
        role: { type: String, enum: ["user", "model"], required: true },
        parts: [{ text: { type: String, required: true } }],
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const dailyChatHistorySchema = new Schema<IDailyChatHistory>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        sessionId: { type: String },
        dayKey: { type: String, required: true },
        messages: { type: [chatItemSchema], default: [] },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// One doc per day per authenticated user
dailyChatHistorySchema.index(
    { userId: 1, dayKey: 1 },
    { unique: true, sparse: true }
);

// One doc per day per guest session
dailyChatHistorySchema.index(
    { sessionId: 1, dayKey: 1 },
    { unique: true, sparse: true }
);

export const DailyChatHistoryModel = mongoose.model<IDailyChatHistory>(
    "DailyChatHistory",
    dailyChatHistorySchema
);