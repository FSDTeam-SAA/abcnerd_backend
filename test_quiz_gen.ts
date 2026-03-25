import { Types } from "mongoose";
import { generateQuizService } from "./src/modules/quiz/quiz.service";
import { QuestionModel } from "./src/modules/question/question.models";
import { CategoryWordModel } from "./src/modules/categoryword/categoryword.models";
import { Progress } from "./src/modules/progress/progress.models";
import { NotebookModel } from "./src/modules/notebook/notebook.models";
import { QuizModel } from "./src/modules/quiz/quiz.models";

// Mocking mongoose models
(CategoryWordModel.findById as any) = async () => ({ _id: new Types.ObjectId(), name: "Test Category" });
(Progress.findOne as any) = async () => ({ memorized: [new Types.ObjectId()], attemptedQuestions: [] });
(QuestionModel.find as any) = async () => [
  {
    _id: new Types.ObjectId(),
    questionText: "What is 1+1?",
    options: ["1", "2", "3", "4"],
    correctAnswer: "2",
    wordRef: new Types.ObjectId(),
    isActive: true,
  },
];
(NotebookModel.findOne as any) = async () => ({ entries: [] });
(QuizModel.create as any) = async (data: any) => ({ _id: new Types.ObjectId(), ...data });

async function test() {
  try {
    const userId = new Types.ObjectId();
    const categoryId = new Types.ObjectId().toString();
    const result = await generateQuizService(userId, categoryId, 1);
    
    console.log("Quiz Generation Result:");
    console.log(JSON.stringify(result, null, 2));

    const question = result.questions[0];
    if (question && question.correctAnswer === "2") {
      console.log("\nVERIFICATION SUCCESS: correctAnswer included in response.");
    } else {
      console.log("\nVERIFICATION FAILED: correctAnswer missing or incorrect.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
    process.exit(1);
  }
}

test();
