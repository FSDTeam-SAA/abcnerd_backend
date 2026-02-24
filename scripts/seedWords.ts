import axios from "axios";
import fs from "fs";
import mongoose from "mongoose";
import wordListPath from "word-list";
import { WordmanagementModel } from "../src/modules/wordmanagement/wordmanagement.models";
import config from "../src/config";

mongoose.set("bufferCommands", false);

const seedDictionary = async () => {
    try {
        // 1️⃣ Connect to MongoDB
        await mongoose.connect(config.mongoUri as string);
        console.log("MongoDB connected ✅");

        // 2️⃣ Read all words from word-list
        const allWords = fs.readFileSync(wordListPath, "utf8").split("\n");

        const letters = "abcdefghijklmnopqrstuvwxyz";
        let selectedWords: string[] = [];

        // 3️⃣ Pick words A-Z (10 per letter)
        for (const letter of letters) {
            const filtered = allWords
                .filter((w) => w.startsWith(letter) && w.length > 3)
                .slice(0, 30); // increase for more words
            selectedWords.push(...filtered);
        }

        console.log(`Total selected words before DB check: ${selectedWords.length}`);

        // 4️⃣ Fetch existing words from DB
        const existingWords = await WordmanagementModel.find(
            { word: { $in: selectedWords } },
            { word: 1, _id: 0 }
        ).lean();

        const existingSet = new Set(existingWords.map((w) => w.word));

        // 5️⃣ Filter words NOT in DB
        selectedWords = selectedWords.filter((w) => !existingSet.has(w));
        console.log(`Words to request from API: ${selectedWords.length}`);

        const bulkData = [];
        let processedCount = 0;
        let skippedCount = 0;

        // 6️⃣ Fetch definitions for words NOT in DB
        for (const word of selectedWords) {
            try {
                const response: any = await axios.get(
                    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
                );

                const data = response.data[0];
                const description =
                    data.meanings?.[0]?.definitions?.[0]?.definition || "No definition";

                const synonyms =
                    data.meanings?.[0]?.definitions?.[0]?.synonyms || [];

                bulkData.push({
                    word,
                    description,
                    status: "active",
                    synonyms,
                    categoryWordId: "64f0b3c7a9d1e2f5c1234567",
                });

                processedCount++;
                console.log(`[✅] ${word} processed (definition fetched)`);

                // Small delay to avoid API rate limit
                await new Promise((res) => setTimeout(res, 200));
            } catch (err: any) {
                skippedCount++;
                const reason =
                    err.response?.status === 404
                        ? "word not found in API"
                        : err.message || "unknown error";
                console.log(`[⚠️] ${word} skipped (${reason})`);
            }
        }

        // 7️⃣ Bulk insert
        if (bulkData.length > 0) {
            await WordmanagementModel.insertMany(bulkData, { ordered: false });
            console.log(`[📦] Inserted ${bulkData.length} new words into DB`);
        }

        console.log(
            `Seeding completed 🚀 | Processed: ${processedCount} | Skipped: ${skippedCount}`
        );

        await mongoose.disconnect();
        process.exit(0);
    } catch (error: any) {
        console.error("Seeder Error:", error.message || error);
        process.exit(1);
    }
};

seedDictionary();