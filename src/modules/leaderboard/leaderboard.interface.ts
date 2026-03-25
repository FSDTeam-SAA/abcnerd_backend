import { Types } from "mongoose";

export interface ILeaderboardEntry {
  rank: number;
  user: {
    _id: Types.ObjectId;
    name: string;
    email: string;
    image?: string;
  };
  totalScore: number;
  totalAttempts: number;
  averagePercentage: number;
  highestScore: number;
}

export interface IDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
}

export interface IPerformanceTrendPoint {
  label: string;
  currentYear: number;
  lastYear: number;
}

export interface ILeaderboardResponse {
  leaderboard: ILeaderboardEntry[];
  stats: IDashboardStats;
  performanceTrend: IPerformanceTrendPoint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ILeaderboard {
  title: string;
  description?: string;
  status: "active" | "inactive";
  isDeleted: boolean;
  slug?: string;
}
