

export enum CategoryWord {
  BASIC_VOCABULARY = "Basic vocabulary",
  BUSINESS = "Business",
}
export interface ICategoryWord {
  _id: string;
  name: string;
  slug?: string;
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
