
import { Types } from "mongoose";

export enum WordType {
  FREQUENT = "Frequent",
  MEDIUM = "Medium",
  DIFFICULTY = "Difficulty",
  ENTIRE = "Entire",
}

export enum PartOfSpeech {
  NOUN = "Noun",
  VERB = "Verb",
  ADJECTIVE = "Adjective",
  ADVERB = "Adverb",
  PRONOUN = "Pronoun",
  PREPOSITION = "Preposition",
  CONJUNCTION = "Conjunction",
  INTERJECTION = "Interjection",
}

export interface IWordmanagement {
  _id: string;
  word: string;
  synonyms?: string[];
  description: string;

  pronunciation?: string;     // "/əˈkɑːmplɪʃ/"
  examples?: string[];

  categoryWordId: Types.ObjectId;
  categoryType?: string; // categoryWord name

  wordType?: WordType;
  partOfSpeech?: PartOfSpeech;

  tags?: string[];

  frequency?: number;   

  status?: string;
  slug?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateWordmanagement {
  word: string;
  description: string;
  status?: "active" | "inactive" | "blocked";

  synonyms?: string[];

  categoryWordId: Types.ObjectId | string;

  wordType: WordType;
  partOfSpeech?: PartOfSpeech;

  tags?: string[];
}

export interface IUpdateWordmanagement {
  word?: string;
  description?: string;
  status?: "active" | "inactive" | "blocked";

  synonyms?: string[];

  categoryWordId?: Types.ObjectId | string;

  wordType?: WordType;
  partOfSpeech?: PartOfSpeech;

  tags?: string[];
}
