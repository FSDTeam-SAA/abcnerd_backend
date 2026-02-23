import { Request, Response, NextFunction } from "express";
import CustomError from "../helpers/CustomError";
import { userModel } from "../modules/usersAuth/user.models";

/* ================= Types ================= */

type Role = "admin" | "user" | string;
type Permission = string;

interface AuthUser {
  _id: string;
  email: string;
  role: Role;
}

interface CustomRequest extends Request {
  user?: AuthUser;
}

/* ================= Middleware ================= */

export const permission =
  (allowedRoles: Role[] = [],) =>
    async (
      req: CustomRequest,
      _res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const userId = (req.user as AuthUser)?._id;
        if (!userId) throw new CustomError(401, "Unauthorized access");

        const user = await userModel.findById(userId).lean();

        if (!user) throw new CustomError(401, "User not found");

        // Use `status` instead of `accountStatus` to match your schema
        if (user.status !== "active") {
          throw new CustomError(403, `Your account is ${user.status}. Access denied.`);
        }

        if (allowedRoles.length && !allowedRoles.includes(user.role)) {
          throw new CustomError(403, "You are not authorized to access this route.");
        }

        req.user = {
          _id: user._id,
          email: user.email,
          role: user.role,
        } as AuthUser;

        next();
      } catch (error) {
        next(error);
      }
    };