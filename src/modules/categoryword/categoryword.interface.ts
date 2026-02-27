

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
