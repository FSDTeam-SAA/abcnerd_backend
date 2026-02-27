import { Types } from "mongoose";

import CustomError from "../../helpers/CustomError";

// ── User এর সব attempt history ──
export const getAttemptHistoryService = async (userId: Types.ObjectId) => {
  const attempts = await QuizAttemptModel.find({ user: userId })
    .populate("quiz", "title description category")
    .sort({ completedAt: -1 });

  if (!attempts.length) throw new CustomError(404, "কোনো attempt history নেই");
  return attempts;
};

// ── একটা specific attempt এর details ──
export const getAttemptByIdService = async (
  userId: Types.ObjectId,
  attemptId: string,
) => {
  const attempt = await QuizAttemptModel.findOne({
    _id: attemptId,
    user: userId,
  }).populate("quiz", "title description category questions");

  if (!attempt) throw new CustomError(404, "Attempt পাওয়া যায়নি");
  return attempt;
};

// ── Admin: একটা quiz এর সব attempts ──
export const getAttemptsByQuizService = async (quizId: string) => {
  const attempts = await QuizAttemptModel.find({ quiz: quizId })
    .populate("user", "name email")
    .sort({ completedAt: -1 });

  if (!attempts.length)
    throw new CustomError(404, "এই quiz এ কোনো attempt নেই");
  return attempts;
};

// ── Admin: সব attempts ──
export const getAllAttemptsService = async () => {
  return await QuizAttemptModel.find()
    .populate("user", "name email")
    .populate("quiz", "title")
    .sort({ completedAt: -1 });
};
