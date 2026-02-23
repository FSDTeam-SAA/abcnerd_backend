import { WordmanagementModel } from "./wordmanagement.models";
import { ICreateWordmanagement } from "./wordmanagement.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";

//TODO: customize as needed

const createWordmanagement = async (data: ICreateWordmanagement) => {
  const item = await WordmanagementModel.create(data);
  if (!item) throw new CustomError(400, "Wordmanagement not created");

  return item;
};

export const wordmanagementService = { createWordmanagement };
