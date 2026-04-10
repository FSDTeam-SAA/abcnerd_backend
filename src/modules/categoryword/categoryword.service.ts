import { CategoryWordModel } from "./categoryword.models";
import { ICreateCategoryWord } from "./categoryword.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";
import { WordmanagementModel } from "../wordmanagement/wordmanagement.models";

//: customize as needed

const createCategoryWord = async (data: ICreateCategoryWord) => {
  const categoryWord = await CategoryWordModel.create(data);
  if (!categoryWord) throw new CustomError(400, "CategoryWord not created");

  return categoryWord;
};

//: get all categorywords
const getAllCategoryWords = async (req: any) => {
  const { page: pagebody, limit: limitbody, sortBy = "asc", isactive = "all" } = req.query;
  const { role } = req?.user;

  // Pagination
  const { page, limit, skip } = paginationHelper(pagebody, limitbody);

  // Filter based on role
  let filter: any = {};

  if (role === "admin") {
    // Admin can filter by active/inactive/all
    const allowedStatus = ["active", "inactive", "all"];
    if (!allowedStatus.includes(isactive)) {
      throw new CustomError(
        400,
        "Invalid isactive value. Allowed values are 'active', 'inactive', 'all'"
      );
    }

    if (isactive === "active") filter.isActive = true;
    else if (isactive === "inactive") filter.isActive = false;
    // 'all' means no filter
  } else {
    // Non-admins always see only active
    filter.isActive = true;
  }

  // Validate sortBy
  const allowedSort = ["asc", "desc"];
  if (!allowedSort.includes(sortBy)) {
    throw new CustomError(400, "Invalid sortBy, allowed values are 'asc' and 'desc'");
  }

  // Map sortBy to actual sorting
  const sort: any = sortBy === "acc" ? { createdAt: 1 } : { createdAt: -1 };

  // Fetch data
  let categoryWords = await CategoryWordModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .lean() as any;

  const total = await CategoryWordModel.countDocuments(filter);

  const { Progress } = await import("../progress/progress.models");
  const { WordmanagementModel } = await import("../wordmanagement/wordmanagement.models");
  const mongoose = await import("mongoose");

  let memorizedStrs: string[] = [];
  if (req?.user?._id) {
    const progress = await Progress.findOne({ user: req.user._id });
    const memorizedIds = progress?.memorized || [];
    memorizedStrs = memorizedIds.map((id: any) => id.toString());
  }

  categoryWords = await Promise.all(
    categoryWords.map(async (cat: any) => {
      const catId = new mongoose.Types.ObjectId(cat._id.toString());

      const totalWord = await WordmanagementModel.countDocuments({
        $or: [
          { categoryWordId: catId },
          { categoryType: cat.name }
        ]
      });

      let learnedWord = 0;
      if (memorizedStrs.length > 0) {
        learnedWord = await WordmanagementModel.countDocuments({
          $or: [
            { categoryWordId: catId },
            { categoryType: cat.name }
          ],
          _id: { $in: memorizedStrs }
        });
      }

      return {
        ...cat,
        totalWord,
        learnedWord
      };
    })
  );

  return {
    categoryWords,
    meta: {
      page,
      limit,
      totalCategoryWords: total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
const getCategoryWordById = async (categorywordId: string) => {
  const categoryWord = await CategoryWordModel.findById(categorywordId);
  if (!categoryWord) throw new CustomError(400, "CategoryWord not found");
  return categoryWord;
};


const updateCategoryWord = async (categorywordId: string, data: any) => {
  const categoryWord = await CategoryWordModel.findByIdAndUpdate(categorywordId, data, { returnDocument: "after" });
  if (!categoryWord) throw new CustomError(400, "CategoryWord not found");
  return categoryWord;
};

//delete categoryword by categorywordId
const deleteCategoryWord = async (categorywordId: string) => {
  // Check if any Wordmanagement is linked
  const wordManagementExists = await WordmanagementModel.exists({
    categoryWordId: categorywordId,
  });

  if (wordManagementExists) {
    throw new CustomError(
      400,
      "Cannot delete. Wordmanagement entries are associated with this category."
    );
  }

  const categoryWord = await CategoryWordModel.findByIdAndDelete(categorywordId);
  if (!categoryWord) throw new CustomError(400, "CategoryWord not found");
  return categoryWord;
};

export const categorywordService = { createCategoryWord, getAllCategoryWords, getCategoryWordById, updateCategoryWord, deleteCategoryWord };
