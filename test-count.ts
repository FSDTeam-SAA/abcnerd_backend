import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

// Connect to DB directly
mongoose.connect(process.env.MONGODB_URL as string).then(async () => {
    console.log("Connected to DB");

    // Import models manually using full path or require
    const { CategoryWordModel } = require("./src/modules/categoryword/categoryword.models");
    const { WordmanagementModel } = require("./src/modules/wordmanagement/wordmanagement.models");

    const cats = await CategoryWordModel.find().lean();
    for (const cat of cats) {
        console.log("Category:", cat.name, cat._id);
        const count = await WordmanagementModel.countDocuments({ categoryWordId: cat._id });
        const countActive = await WordmanagementModel.countDocuments({ categoryWordId: cat._id, status: "active" });
        console.log(`  - Word Cnt (all): ${count}, Word Cnt (active): ${countActive}`);
    }

    process.exit(0);
}).catch(console.error);
