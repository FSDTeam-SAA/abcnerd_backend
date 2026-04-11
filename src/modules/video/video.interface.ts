import { Types } from "mongoose";

export interface IVideo {
  _id: Types.ObjectId;
  title: string;
  category: Types.ObjectId;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  order: number;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVideoCreate {
  title: string;
  categoryId: string;
}

export interface IVideoUpdate {
  title?: string;
  order?: number;
  isActive?: boolean;
}
