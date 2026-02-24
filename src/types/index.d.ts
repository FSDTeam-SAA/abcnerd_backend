import { Types } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string | Types.ObjectId;
        email: string;
        role: string;
        status?: string;
      };
    }
  }
}

export {};
