import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { IWordmanagement } from "./wordmanagement.interface";

//TODO: customize as needed

const wordmanagementSchema = new Schema<IWordmanagement>({
  word: { type: String, required: true },
  synonyms: { type: [String], default: [] },
  description: { type: String },
  status: { type: String, default: "active" },
  categoryWordId: { type: Schema.Types.ObjectId, ref: "CategoryWord", required: true },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
wordmanagementSchema.pre("save", async function () {
  if (!this.isModified("word")) return;

  const category = await WordmanagementModel.findOne({ word: this.word });
  if (category) {
    throw new CustomError(400, "Wordmanagement already exist, try another word");
  }

  this.slug = slugify(this.word, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
wordmanagementSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await WordmanagementModel.findOne({ word: update.word });
  if (category) {
    throw new CustomError(400, "Wordmanagement already exist");
  }

  if (update?.word) {
    update.slug = slugify(update.word, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const WordmanagementModel = mongoose.model<IWordmanagement>("Wordmanagement", wordmanagementSchema);
