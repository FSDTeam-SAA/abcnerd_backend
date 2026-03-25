import mongoose, { Schema, Document } from "mongoose";
    import slugify from "slugify";
    import CustomError from "../../helpers/CustomError";
import { ILeaderboard } from "./leaderboard.interface";

//TODO: customize as needed

const leaderboardSchema = new Schema<ILeaderboard>({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "active" },
  isDeleted: { type: Boolean, default: false },
  slug: { type: String },
}, { timestamps: true });

// Generate slug before save
leaderboardSchema.pre("save", async function (this: ILeaderboard & Document, next) {
  if (!this.isModified("title")) return;

  const category = await LeaderboardModel.findOne({ title: this.title });
  if (category) {
    throw new CustomError(400, "Leaderboard already exist");
  }

  this.slug = slugify(this.title, {
    lower: true,
    strict: true,
    trim: true,
  });
});

// Generate slug on update
leaderboardSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate() as any;

  const category = await LeaderboardModel.findOne({ title: update.title });
  if (category) {
    throw new CustomError(400, "Leaderboard already exist");
  }

  if (update?.title) {
    update.slug = slugify(update.title, {
      lower: true,
      strict: true,
      trim: true,
    });
  }

});

export const LeaderboardModel = mongoose.model<ILeaderboard>("Leaderboard", leaderboardSchema);
