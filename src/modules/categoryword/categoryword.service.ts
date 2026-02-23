import { CategoryWordModel } from "./categoryword.models";
import { ICreateCategoryWord } from "./categoryword.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";

//TODO: customize as needed

const createCategoryWord = async (data: ICreateCategoryWord) => {
  const categoryWord = await CategoryWordModel.create(data);
  if (!categoryWord) throw new CustomError(400, "CategoryWord not created");

  return categoryWord;
};

//TODO: get all categorywords
const getAllCategoryWords = async (req: any) => {
  const { page: pagebody, limit: limitbody, sortBy = "acc", isactive = "all" } = req.query;
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
  const allowedSort = ["acc", "dece"];
  if (!allowedSort.includes(sortBy)) {
    throw new CustomError(400, "Invalid sortBy, allowed values are 'acc' and 'dece'");
  }

  // Map sortBy to actual sorting
  const sort: any = sortBy === "acc" ? { createdAt: 1 } : { createdAt: -1 };

  // Fetch data
  const categoryWords = await CategoryWordModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await CategoryWordModel.countDocuments(filter);

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
  const categoryWord = await CategoryWordModel.findByIdAndUpdate(categorywordId, data, { new: true });
  if (!categoryWord) throw new CustomError(400, "CategoryWord not found");
  return categoryWord;
};

//delete categoryword by categorywordId
const deleteCategoryWord = async (categorywordId: string) => {
  //! also implement not delete if any worsds or wordmanaement are associated

  
  const categoryWord = await CategoryWordModel.findByIdAndDelete(categorywordId);
  if (!categoryWord) throw new CustomError(400, "CategoryWord not found");
  return categoryWord;
};

export const categorywordService = { createCategoryWord, getAllCategoryWords, getCategoryWordById, updateCategoryWord, deleteCategoryWord };
