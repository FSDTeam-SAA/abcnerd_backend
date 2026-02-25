import { SubscriptionPlanModel } from "./subscriptionplan.models";
import { ICreateSubscriptionPlan } from "./subscriptionplan.interface";
import CustomError from "../../helpers/CustomError";
import { uploadCloudinary } from "../../helpers/cloudinary";
import { paginationHelper } from "../../utils/pagination";
import { role } from "../usersAuth/user.interface";

//TODO: create single subscriptionplan
const createSubscriptionPlan = async (data: ICreateSubscriptionPlan) => {
  const item = await SubscriptionPlanModel.create(data);
  if (!item) throw new CustomError(400, "SubscriptionPlan not created");

  return item;
};

//TODO: get single subscriptionplan by id
const getSubscriptionPlanById = async (subscriptionplanId: string) => {
  const subscriptionplan = await SubscriptionPlanModel.findOne({ _id: subscriptionplanId, isDeleted: false });
  if (!subscriptionplan) throw new CustomError(404, "SubscriptionPlan not found");

  return subscriptionplan;
};

//TODO: get all subscriptionplan with pagination and search and filter --- IGNORE ---
export const getAllSubscriptionPlan = async (req: any) => {
  const {
    page: pageQuery,
    limit: limitQuery,
    sortBy = "desc",
    search,
    status,
    interval,
    currency,
  } = req.query;

  const role: role = req?.user?.role;

  const { page, limit, skip } = paginationHelper(pageQuery, limitQuery);

  const filter: any = { isDeleted: false };

  // Filter based on role
  if (role === "admin") {
    // admin can filter by status, or see all if not provided
    if (status) {
      const allowedStatus = ["active", "inactive"];
      if (!allowedStatus.includes(status)) {
        throw new CustomError(400, "Invalid status. Allowed: active, inactive");
      }
      filter.status = status;
    }
  } else {
    // user can see only active
    filter.status = "active";
  }

  //interval filter
  if (interval) {
    const allowedInterval = ["month", "year"];
    if (!allowedInterval.includes(interval)) {
      throw new CustomError(400, "Invalid interval. Allowed: month, year");
    }
    filter.interval = interval;
  }

  //currency filter
  if (currency) {
    const cur = String(currency).trim().toUpperCase();
    if (cur.length !== 3) {
      throw new CustomError(400, "Invalid currency. Must be 3 letters (ISO 4217)");
    }
    filter.currency = cur;
  }

  // Search by title or description
  if (search) {
    const s = String(search).trim();
    if (s.length) {
      filter.$or = [
        { title: { $regex: s, $options: "i" } },
        { slug: { $regex: s, $options: "i" } },
        { description: { $regex: s, $options: "i" } },
      ];
    }
  }

  // Sorting
  const allowedSortBy = ["asc", "desc"];
  if (!allowedSortBy.includes(sortBy)) {
    throw new CustomError(400, "Invalid sortBy. Allowed: asc, desc");
  }
  const sortValue = sortBy === "asc" ? 1 : -1;

  const [subscriptionplans, totalSubscriptionPlans] = await Promise.all([
    SubscriptionPlanModel.find(filter)
      .sort({ createdAt: sortValue })
      .skip(skip)
      .limit(limit)
      .lean(),
    SubscriptionPlanModel.countDocuments(filter),
  ]);

  const totalPage = Math.ceil(totalSubscriptionPlans / limit);

  return {
    subscriptionplans,
    meta: {
      page,
      limit,
      totalPage,
      totalSubscriptionPlans
    },
  };
};

//TODO: update single subscriptionplan by id
const updateSubscriptionPlan = async (subscriptionplanId: string, data: Partial<ICreateSubscriptionPlan>) => {
  const subscriptionplan = await SubscriptionPlanModel.findOneAndUpdate({ _id: subscriptionplanId, isDeleted: false }, data, { new: true, runValidators: true });
  if (!subscriptionplan) throw new CustomError(404, "SubscriptionPlan not found");

  return subscriptionplan;
}

//TODO: delete single subscriptionplan by id (soft delete)
const deleteSubscriptionPlan = async (subscriptionplanId: string) => {
  const subscriptionplan = await SubscriptionPlanModel.findOneAndUpdate({ _id: subscriptionplanId, isDeleted: false }, { isDeleted: true }, { new: true });
  if (!subscriptionplan) throw new CustomError(404, "SubscriptionPlan not found");
};

export const subscriptionplanService = { createSubscriptionPlan, getSubscriptionPlanById, getAllSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan };
