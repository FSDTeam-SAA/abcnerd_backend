

export enum CategoryWord {
  BASIC_VOCABULARY = "Basic vocabulary",
  BUSINESS = "Business",
  // ECONOMY = "Economy",
  // IMPORTANCE = "Importance",
}
export interface ICategoryWord {
  _id: string;
  name: string;               // "Basic vocabulary", "Business"
  slug?: string;              // "basic-vocabulary"
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateCategoryWord {
  name: string;
  description?: string;
  isActive?: boolean;
  
}
