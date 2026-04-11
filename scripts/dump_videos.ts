import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

const videoSchema = new mongoose.Schema({
  title: String,
  cloudinaryUrl: String,
  category: mongoose.Schema.Types.ObjectId,
  isActive: Boolean,
});

const Video = mongoose.model("Video", videoSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "");
  const videos = await Video.find({});
  console.log(JSON.stringify(videos, null, 2));
  await mongoose.connection.close();
}

run().catch(console.error);
