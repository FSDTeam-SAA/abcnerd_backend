import { WordmanagementModel } from "./wordmanagement.models";
import { ICreateWordmanagement } from "./wordmanagement.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";

//TODO: customize as needed

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

  const { role } = req?.user;

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

//TODO: update wordmanagement by wordmanagementId
const updateWordmanagement = async (wordmanagementId: string, data: any) => {

  const wordmanagement = await WordmanagementModel.findOneAndUpdate(
    { _id: wordmanagementId },
    data,
    { new: true, runValidators: true }
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

//TODO: delete wordmanagement by wordmanagementId
const deleteWordmanagement = async (wordmanagementId: string) => {
  const wordmanagement = await WordmanagementModel.findByIdAndDelete(wordmanagementId);
  if (!wordmanagement) throw new CustomError(400, "Wordmanagement not found");
  return wordmanagement;
};

export const wordmanagementService = { createWordmanagement, getAllWordmanagements, getWordmanagementById, updateWordmanagement, deleteWordmanagement };
