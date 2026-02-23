
//TODO: customize as needed

import { Types } from "mongoose";

export interface IWordmanagement {
  _id: string;
  word: string;
  synonyms?: string[];
  description: string;
  categoryWordId: Types.ObjectId;
  status?: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateWordmanagement {
  title: string;                // the main word
  description?: string;          // optional explanation or definition
  status?: "active" | "inactive"; // restrict to allowed values
  synonyms?: string[];           // optional array of synonyms
}
