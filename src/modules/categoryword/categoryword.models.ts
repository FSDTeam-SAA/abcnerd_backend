import mongoose, { Schema } from "mongoose";
import slugify from "slugify";
import CustomError from "../../helpers/CustomError";
import { CategoryWord, ICategoryWord } from "./categoryword.interface";

//TODO: customize as needed

const categorywordSchema = new Schema<ICategoryWord>({
  name: {
    type: String, required: true,
    enum: Object.values(CategoryWord)
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Generate slug before save
categorywordSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return;

  const category = await CategoryWordModel.findOne({ name: this.name });
  if (category) {
    throw new CustomError(400, "CategoryWord already exist");
  }

  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
categorywordSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await CategoryWordModel.findOne({ name: update.name });
  if (category) {
    throw new CustomError(400, "CategoryWord already exist with this name");
  }

  if (update?.name) {
    update.slug = slugify(update.name , {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const CategoryWordModel = mongoose.model<ICategoryWord>("CategoryWord", categorywordSchema);
