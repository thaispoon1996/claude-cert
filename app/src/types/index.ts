export interface Domain {
  id: string;
  number: number;
  name: string;
  nameVi: string;
  weight: number;
  description?: string | null;
  createdAt: Date;
  subdomains?: Subdomain[];
}

export interface Subdomain {
  id: string;
  domainId: string;
  number: string;
  name: string;
  nameVi: string;
  focus: string;
  concepts: string;
  createdAt: Date;
  domain?: Domain;
  lessons?: Lesson[];
  questions?: Question[];
  labs?: Lab[];
}

export interface Lesson {
  id: string;
  subdomainId: string;
  title: string;
  titleVi: string;
  summary: string;
  content: string;
  diagramSvg?: string | null;
  antiPatterns: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  subdomain?: Subdomain;
  quizItems?: Question[];
  progress?: LessonProgress[];
}

export interface Question {
  id: string;
  subdomainId: string;
  lessonId?: string | null;
  scenario: string;
  stem: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanationCorrect: string;
  explanationA: string;
  explanationB: string;
  explanationC: string;
  explanationD: string;
  difficulty: string;
  isAntiPattern: boolean;
  tags: string;
  isDiagnostic: boolean;
  createdAt: Date;
  subdomain?: Subdomain;
  lesson?: Lesson | null;
}

export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  confidence: string;
  context: string;
  mockExamId?: string | null;
  createdAt: Date;
  question?: Question;
}

export interface MockExamSession {
  id: string;
  userId: string;
  mode: string;
  domainFilter?: string | null;
  questionIds: string;
  startedAt: Date;
  finishedAt?: Date | null;
  timeSpentSec?: number | null;
  rawScore?: number | null;
  scaledScore?: number | null;
  passed?: boolean | null;
  domainScores?: string | null;
  attempts?: Attempt[];
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: string;
  quizScore?: number | null;
  completedAt?: Date | null;
  updatedAt: Date;
  lesson?: Lesson;
}

export interface Lab {
  id: string;
  subdomainId: string;
  title: string;
  titleVi: string;
  objective: string;
  prerequisites: string;
  steps: string;
  expectedOutput: string;
  challenge?: string | null;
  quizItems: string;
  order: number;
  createdAt: Date;
  subdomain?: Subdomain;
  progress?: LabProgress[];
}

export interface LabProgress {
  id: string;
  userId: string;
  labId: string;
  status: string;
  quizScore?: number | null;
  completedAt?: Date | null;
  updatedAt: Date;
  lab?: Lab;
}

export interface DashboardStats {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  streak: number;
  domainProgress: DomainProgress[];
  weakSpots: WeakSpot[];
  recentAttempts: number;
}

export interface DomainProgress {
  domain: Domain;
  totalQuestions: number;
  answeredCorrect: number;
  masteryPercent: number;
}

export interface WeakSpot {
  subdomain: Subdomain;
  domain: Domain;
  accuracy: number;
  totalAttempts: number;
}
