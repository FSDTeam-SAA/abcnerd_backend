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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === "Day") {
    startDate = startOfToday;
  } else if (filter === "Week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.getFullYear(), now.getMonth(), diff);
  } else if (filter === "Month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === "Year") {
    startDate = new Date(now.getFullYear(), 0, 1);
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
          image: "$user.profileImage.secure_url",
        },
        totalScore: 1,
        totalAttempts: 1,
        averagePercentage: 1,
        highestScore: 1,
      },
    }
  );

  const unwindIndex = startDate ? 6 : 5;

  // Monthly performance trend aggregation (Dynamic Scale: Day, Week, Month, Year - Year-over-Year Comparison)
  let trendDataLabels: string[] = [];
  let currentRangeMatch: any = {};
  let lastYearRangeMatch: any = {};
  let groupBy: any = {};

  const currentYearNum = now.getFullYear();
  const lastYearNum = currentYearNum - 1;

  if (filter === "Day") {
    // Labels for 24 hours
    trendDataLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
    const startOfToday = new Date(currentYearNum, now.getMonth(), now.getDate());
    const startOfSameDayLastYear = new Date(lastYearNum, now.getMonth(), now.getDate());

    currentRangeMatch = { $match: { completedAt: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) } } };
    lastYearRangeMatch = { $match: { completedAt: { $gte: startOfSameDayLastYear, $lt: new Date(startOfSameDayLastYear.getTime() + 24 * 60 * 60 * 1000) } } };
    groupBy = { $group: { _id: { hour: { $hour: "$completedAt" } }, avgPercentage: { $avg: "$percentage" } } };
  } else if (filter === "Week") {
    // Labels for 7 days
    trendDataLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfThisWeek = new Date(currentYearNum, now.getMonth(), diff);
    const startOfSameWeekLastYear = new Date(lastYearNum, now.getMonth(), diff);

    currentRangeMatch = { $match: { completedAt: { $gte: startOfThisWeek, $lt: new Date(startOfThisWeek.getTime() + 7 * 24 * 60 * 60 * 1000) } } };
    lastYearRangeMatch = { $match: { completedAt: { $gte: startOfSameWeekLastYear, $lt: new Date(startOfSameWeekLastYear.getTime() + 7 * 24 * 60 * 60 * 1000) } } };
    groupBy = { $group: { _id: { dayOfWeek: { $dayOfWeek: "$completedAt" } }, avgPercentage: { $avg: "$percentage" } } };
  } else if (filter === "Month") {
    // Labels for 30 days
    trendDataLabels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    const startOfThisMonth = new Date(currentYearNum, now.getMonth(), 1);
    const startOfSameMonthLastYear = new Date(lastYearNum, now.getMonth(), 1);

    currentRangeMatch = { $match: { completedAt: { $gte: startOfThisMonth, $lt: new Date(currentYearNum, now.getMonth() + 1, 1) } } };
    lastYearRangeMatch = { $match: { completedAt: { $gte: startOfSameMonthLastYear, $lt: new Date(lastYearNum, now.getMonth() + 1, 1) } } };
    groupBy = { $group: { _id: { dayOfMonth: { $dayOfMonth: "$completedAt" } }, avgPercentage: { $avg: "$percentage" } } };
  } else {
    // Year view (Default)
    trendDataLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const startOfThisYear = new Date(currentYearNum, 0, 1);
    const startOfLastYear = new Date(lastYearNum, 0, 1);

    currentRangeMatch = { $match: { completedAt: { $gte: startOfThisYear, $lt: new Date(currentYearNum + 1, 0, 1) } } };
    lastYearRangeMatch = { $match: { completedAt: { $gte: startOfLastYear, $lt: new Date(lastYearNum + 1, 0, 1) } } };
    groupBy = { $group: { _id: { month: { $month: "$completedAt" } }, avgPercentage: { $avg: "$percentage" } } };
  }

  const [
    totalCount,
    rawData,
    totalUsers,
    activeUsers,
    totalQuestions,
    currentTrendResults,
    lastYearTrendResults,
  ] = await Promise.all([
    QuizAttemptModel.aggregate([
      ...aggregationPipeline.slice(0, unwindIndex),
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
    QuizAttemptModel.aggregate([currentRangeMatch, groupBy]),
    QuizAttemptModel.aggregate([lastYearRangeMatch, groupBy]),
  ]);

  const performanceTrend = trendDataLabels.map((label, index) => {
    let currentVal = 0;
    let lastYearVal = 0;

    if (filter === "Day") {
      currentVal = currentTrendResults.find(r => r._id.hour === index)?.avgPercentage || 0;
      lastYearVal = lastYearTrendResults.find(r => r._id.hour === index)?.avgPercentage || 0;
    } else if (filter === "Week") {
      const mongoDay = (index + 2) % 7 || 7;
      currentVal = currentTrendResults.find(r => r._id.dayOfWeek === mongoDay)?.avgPercentage || 0;
      lastYearVal = lastYearTrendResults.find(r => r._id.dayOfWeek === mongoDay)?.avgPercentage || 0;
    } else if (filter === "Month") {
      currentVal = currentTrendResults.find(r => r._id.dayOfMonth === index + 1)?.avgPercentage || 0;
      lastYearVal = lastYearTrendResults.find(r => r._id.dayOfMonth === index + 1)?.avgPercentage || 0;
    } else {
      currentVal = currentTrendResults.find(r => r._id.month === index + 1)?.avgPercentage || 0;
      lastYearVal = lastYearTrendResults.find(r => r._id.month === index + 1)?.avgPercentage || 0;
    }

    return {
      label,
      currentYear: Math.round(currentVal * 100) / 100,
      lastYear: Math.round(lastYearVal * 100) / 100,
    };
  });

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
    performanceTrend,
    total,
    page,
    limit,
    totalPages,
  };
};

export const leaderboardService = { getAllLeaderboardData };
