import fs from "fs";
import { WordmanagementModel } from "./wordmanagement.models";
import { ICreateWordmanagement, WordType } from "./wordmanagement.interface";
import CustomError from "../../helpers/CustomError";
import { paginationHelper } from "../../utils/pagination";
import { CategoryWordModel } from "../categoryword/categoryword.models";

const createWordmanagement = async (data: ICreateWordmanagement) => {
  const item = await WordmanagementModel.create(data);
  if (!item) throw new CustomError(400, "Wordmanagement not created");

  return item;
};


const getAllWordmanagements = async (req: any) => {
  const {
    page: pagebody,
    limit: limitbody,
    sortBy = "asc",
    isactive = "all",
    categoryType,
    search,
  } = req.query;

  const role = req?.user?.role;

  // Pagination
  const { page, limit, skip } = paginationHelper(pagebody, limitbody);

  let filter: any = {};

  /* ================= STATUS FILTER ================= */

  if (role === "admin") {
    const allowedStatus = ["active", "inactive", "blocked", "all"];
    if (!allowedStatus.includes(isactive)) {
      throw new CustomError(
        400,
        "Invalid isactive value. Allowed: active, inactive, all"
      );
    }

    if (isactive !== "all") {
      filter.status = isactive;
    }
  } else {
    filter.status = "active";
  }

  /* ================= CATEGORY TYPE FILTER ================= */

  if (categoryType) {
    filter.categoryType = categoryType;
  }

  /* ================= WORD SEARCH ================= */

  if (search) {
    filter.word = {
      $regex: search,
      $options: "i", // case-insensitive
    };
  }

  /* ================= SORT ================= */

  const allowedSortBy = ["asc", "desc"];
  if (!allowedSortBy.includes(sortBy)) {
    throw new CustomError(
      400,
      "Invalid sortBy value. Allowed values are 'asc', 'desc'"
    );
  }

  // Convert to Mongo sort
  const sortValue = sortBy === "asc" ? 1 : -1;

  // Example: sort by createdAt always
  const wordmanagements = await WordmanagementModel.find(filter)
    .sort({ createdAt: sortValue })
    .skip(skip)
    .limit(limit);

  //count the total number of wordmanagements
  const totalWordmanagements = await WordmanagementModel.countDocuments(filter);
  const totalPage = Math.ceil(totalWordmanagements / limit);

  return {
    wordmanagements,
    meta: {
      page,
      limit,
      totalPage,
      totalWordmanagements,
    },
  };
};


const getWordmanagementById = async (role: string, wordmanagementId: string) => {

  const filter: any = { _id: wordmanagementId };
  if (role !== "admin") {
    filter.status = "active";
  }

  const wordmanagement = await WordmanagementModel.findOne(filter);
  if (!wordmanagement) throw new CustomError(400, "Wordmanagement not found");
  return wordmanagement;
};

//: update wordmanagement by wordmanagementId
const updateWordmanagement = async (wordmanagementId: string, data: any) => {

  const wordmanagement = await WordmanagementModel.findOneAndUpdate(
    { _id: wordmanagementId },
    data,
    { returnDocument: "after", runValidators: true }
  );

  if (!wordmanagement) throw new CustomError(400, "Wordmanagement not found");
  if (wordmanagement.partOfSpeech) {
    const tags = wordmanagement?.tags || [];
    if (wordmanagement.partOfSpeech) {
      const pos = wordmanagement.partOfSpeech.toLowerCase();
      if (!tags.includes(pos)) {
        tags.push(pos);
      }
    }
  }

  if (!wordmanagement) throw new CustomError(400, "Wordmanagement not found");
  return wordmanagement;
};

//: delete wordmanagement by wordmanagementId
const deleteWordmanagement = async (wordmanagementId: string) => {
  const wordmanagement = await WordmanagementModel.findByIdAndDelete(wordmanagementId);
  if (!wordmanagement) throw new CustomError(400, "Wordmanagement not found");
  return wordmanagement;
};

const bulkUpload = async (filePath: string) => {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const lines = fileContent.split(/\r?\n/);

  if (lines.length < 2) {
    throw new CustomError(400, "CSV file is empty or missing data rows");
  }

  // Fetch all categories for mapping
  const categories = await CategoryWordModel.find({});
  const categoryMap = new Map();
  let defaultCategory = categories[0];

  categories.forEach((cat) => {
    categoryMap.set(cat.name.toLowerCase(), cat._id);
    if (cat.name.toLowerCase() === "default") {
      defaultCategory = cat;
    }
  });

  if (!defaultCategory && categories.length === 0) {
    throw new CustomError(400, "No categories found in the database. Please create at least one category first.");
  }

  const bulkData: any[] = [];

  // Simple CSV parser that handles quotes
  const parseCSVLine = (line: string) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote ""
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Skip header (lines[0])
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const columns = parseCSVLine(line);

    const word = columns[1];
    const description = columns[2];
    const exampleStr = columns[3];
    const categoryName = columns[4];
    const tagsStr = columns[5];

    if (!word || !description) continue;

    const examples = exampleStr ? [exampleStr] : [];
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    // Add categoryName to tags if it doesn't match a category
    let categoryWordId = defaultCategory?._id;
    if (categoryName) {
      const existingCatId = categoryMap.get(categoryName.toLowerCase());
      if (existingCatId) {
        categoryWordId = existingCatId;
      } else {
        tags.push(categoryName);
      }
    }

    bulkData.push({
      word,
      description,
      examples,
      categoryWordId,
      tags,
      wordType: WordType.ENTIRE, // Default word type
      status: "active"
    });
  }

  if (bulkData.length === 0) {
    throw new CustomError(400, "No valid data found in CSV");
  }

  // Fetch existing words to skip duplicates
  const existingWords = await WordmanagementModel.find({
    word: { $in: bulkData.map(d => d.word) }
  }).select("word");
  const existingSet = new Set(existingWords.map(w => w.word.toLowerCase()));

  const finalData = bulkData.filter(d => !existingSet.has(d.word.toLowerCase()));
  const totalSkipped = bulkData.length - finalData.length;

  if (finalData.length === 0 && totalSkipped > 0) {
    return {
      count: 0,
      message: `0 words uploaded, ${totalSkipped} duplicates skipped`
    };
  }

  if (finalData.length === 0) {
    throw new CustomError(400, "No valid data found in CSV");
  }

  // Use create to trigger pre-save middleware (slug, categoryType, etc.)
  const items = await WordmanagementModel.create(finalData);

  // Clean up file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return {
    count: items.length,
    message: `${items.length} words uploaded successfully, ${totalSkipped} duplicates skipped`
  };
};

export const wordmanagementService = {
  createWordmanagement,
  getAllWordmanagements,
  getWordmanagementById,
  updateWordmanagement,
  deleteWordmanagement,
  bulkUpload
};
