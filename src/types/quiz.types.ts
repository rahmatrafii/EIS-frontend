export type QuizType = "PRE_ZOO" | "POST_ZOO" | "RETENTION_1W" | "RETENTION_1M";
export type QuizScope = "GLOBAL" | "EXHIBIT";

export interface Question {
  id: number;
  quizId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
}

export interface Quiz {
  id: number;
  title: string;
  quizType: QuizType;
  scope: QuizScope;
  ageCategory: "CHILD" | "TEEN" | "ADULT";
  exhibitId: number | null;
  questions: Question[];
}

export interface QuizAnswerPayload {
  questionId: number;
  chosenOption: "A" | "B" | "C" | "D";
}

export interface QuizSubmitPayload {
  quizId: number;
  sessionId: number;
  answers: QuizAnswerPayload[];
}

export interface QuizAttemptAnswer {
  questionId: number;
  chosenOption: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  correctOption?: "A" | "B" | "C" | "D" | null;
}

export interface QuizAttemptResult {
  id: number;
  userId: number;
  sessionId: number;
  quizId: number;
  totalQuestions: number;
  correctAnswers: number;
  finalScore: number;
  startedAt: string;
  completedAt: string;
  answers?: QuizAttemptAnswer[];
}

export interface QuizResultComparison {
  preZooScore: number;
  postZooScore: number;
  knowledgeGain: number;
  hasPreZoo?: boolean;
  hasPostZoo?: boolean;
}

export type RetentionQuizStatus = "PENDING" | "SENT" | "COMPLETED" | "EXPIRED";

export interface RetentionScheduleDetail {
  status: RetentionQuizStatus;
  sentAt: string | null;
  completedAt: string | null;
  expiresAt: string;
  token?: string | null;
  score?: number | null;
}

export type RetentionQuizDetail = RetentionScheduleDetail;

export interface RetentionStatus {
  h7: RetentionQuizDetail;
  h30: RetentionQuizDetail;
  schedules?: any[];
}

