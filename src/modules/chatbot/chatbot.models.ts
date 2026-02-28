import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { IChatbot } from "./chatbot.interface";

const chatbotSchema = new Schema<IChatbot>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// ── pre save ──────────────────────────────
chatbotSchema.pre("save", async function (next) {
  if (!this.isModified("title")) return;

  const existing = await ChatbotModel.findOne({
    title: this.title,
    isDeleted: false,
  });
  if (existing) throw new CustomError(400, "Chatbot with this title already exists");

  this.slug = slugify(this.title, { lower: true, strict: true, trim: true });
  ;
});

// ── pre findOneAndUpdate ──────────────────
chatbotSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;
  if (!update?.$set?.title) return;

  const existing = await ChatbotModel.findOne({
    title: update.$set.title,
    isDeleted: false,
  });
  if (existing) throw new CustomError(400, "Chatbot with this title already exists");

  update.$set.slug = slugify(update.$set.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

export const ChatbotModel = mongoose.model<IChatbot>("Chatbot", chatbotSchema);