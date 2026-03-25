import { QuizAttemptModel } from "../quizattempt/quizattempt.models";
import { userModel } from "../usersAuth/user.models";
import { QuestionModel } from "../question/question.models";
import { ILeaderboardResponse } from "./leaderboard.interface";

const getAllLeaderboardData = async (
  page: number = 1,
  limit: number = 10,
  filter?: string
) => {
  const skip = (page - 1) * limit;

  // Calculate start date based on filter
  let startDate: Date | null = null;
  const now = new Date();

  if (filter === "Day") {
    startDate = new Date(now.setHours(0, 0, 0, 0));
  } else if (filter === "Week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filter === "Month") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (filter === "Year") {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  // Aggregate quiz attempts: group by user, compute totals, then rank
  const aggregationPipeline: any[] = [];

  if (startDate) {
    aggregationPipeline.push({
      $match: {
        completedAt: { $gte: startDate },
      },
    });
  }

  aggregationPipeline.push(
    {
      $group: {
        _id: "$user",
        totalScore: { $sum: "$score" },
        totalAttempts: { $sum: 1 },
        totalPercentage: { $sum: "$percentage" },
        highestScore: { $max: "$score" },
      },
    },
    {
      $addFields: {
        averagePercentage: {
          $round: [{ $divide: ["$totalPercentage", "$totalAttempts"] }, 2],
        },
      },
    },
    {
      $sort: { totalScore: -1, averagePercentage: -1 },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        _id: 0,
        user: {
          _id: "$user._id",
          name: "$user.name",
          email: "$user.email",
          image: "$user.image",
        },
        totalScore: 1,
        totalAttempts: 1,
        averagePercentage: 1,
        highestScore: 1,
      },
    }
  );

  const unwindIndex = startDate ? 6 : 5;

  const [totalCount, rawData, totalUsers, activeUsers, totalQuestions] =
    await Promise.all([
      QuizAttemptModel.aggregate([
        ...aggregationPipeline.slice(0, unwindIndex), // up to $unwind
        { $count: "total" },
      ]),
      QuizAttemptModel.aggregate([
        ...aggregationPipeline,
        { $skip: skip },
        { $limit: limit },
      ]),
      userModel.countDocuments({ role: { $ne: "admin" } }),
      userModel.countDocuments({ role: { $ne: "admin" }, status: "active" }),
      QuestionModel.countDocuments({}),
    ]);

  const total = totalCount[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  // Attach global rank (factoring in skip for pagination)
  const leaderboard = rawData.map((entry: any, index: number) => ({
    rank: skip + index + 1,
    ...entry,
  }));

  return {
    leaderboard,
    stats: {
      totalUsers,
      activeUsers,
      totalQuestions,
    },
    total,
    page,
    limit,
    totalPages,
  };
};

export const leaderboardService = { getAllLeaderboardData };
