import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { IWordmanagement, PartOfSpeech, WordType } from "./wordmanagement.interface";
import { CategoryWordModel } from "../categoryword/categoryword.models";



const wordmanagementSchema = new Schema<IWordmanagement>(
  {
    word: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    synonyms: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    pronunciation: {
      type: String,
      trim: true,
      default: null,
    },

    examples: {
      type: [String],
      default: [],
      trim: true
    },

    /* Category */
    categoryWordId: {
      type: Schema.Types.ObjectId,
      ref: "CategoryWord",
      required: true,
      index: true,
    },

    categoryType: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    /* Classification */
    wordType: {
      type: String,
      enum: Object.values(WordType),   // enum validation
      required: true,
    },

    partOfSpeech: {
      type: String,
      enum: Object.values(PartOfSpeech),
      default: null,
    },

    /* Frequency */
    frequency: {
      type: Number,
      default: 0,
    },

    /* Tags */
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    /* Status */
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },

    /* Slug */
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save to sync categoryType from categoryWordId if missing
wordmanagementSchema.pre("save", async function () {
  if (this.categoryWordId && !this.categoryType) {
    try {
      const cat = await CategoryWordModel.findById(this.categoryWordId);
      if (cat) {
        this.categoryType = cat.name;
      }
    } catch (e) {
      console.error("Error syncing categoryType:", e);
    }
  }
});

// categoryType middleware restored

//premiddleware for part of speech take partOfSpeech and push to tags if not exist
wordmanagementSchema.pre("save", function (next) {
  const tags = this?.tags || [];

  if (this.partOfSpeech) {
    const pos = this.partOfSpeech.toLowerCase();
    if (!tags.includes(pos)) {
      tags.push(pos);
    }
  }
  this.tags = tags; // reassign back
});

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

wordmanagementSchema.index({ status: 1, wordType: 1, categoryWordId: 1 });
wordmanagementSchema.index({ status: 1, wordType: 1, categoryType: 1 });

export const WordmanagementModel = mongoose.model<IWordmanagement>("Wordmanagement", wordmanagementSchema);
