import { NoteBookModel } from "./notebook.models";
import { ICreateNoteBook } from "./notebook.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";

//TODO: customize as needed

const createNoteBook = async (data: ICreateNoteBook, image?: Express.Multer.File) => {
  const item = await NoteBookModel.create(data);
  if (!item) throw new CustomError(400, "NoteBook not created");

  if (image) {
    const uploaded = await uploadCloudinary(image.path);
    if (uploaded) {
      item.image = uploaded;
      await item.save();
    }
  }

  return item;
};

export const notebookService = { createNoteBook };
