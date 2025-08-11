import { z } from "zod";

// Base types for e-learning content
export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type LearningStyle = "visual" | "auditory" | "kinesthetic" | "reading_writing";
export type AssessmentType = "multiple_choice" | "true_false" | "short_answer" | "essay" | "practical" | "peer_review";
export type ContentType = "text" | "video" | "audio" | "image" | "interactive" | "simulation" | "quiz" | "assignment";

// Learning Objective structure following Bloom's Taxonomy
export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  bloomLevel: BloomLevel;
  measurableOutcome: string;
  assessmentCriteria: string[];
  prerequisites: string[];
  estimatedTime: number; // in minutes
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Content Block - basic unit of learning content
export interface ContentBlock {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  metadata: {
    duration?: number; // in minutes
    difficulty: DifficultyLevel;
    learningStyles: LearningStyle[];
    interactionLevel: "passive" | "active" | "interactive";
    accessibility?: {
      altText?: string;
      captions?: boolean;
      transcription?: boolean;
    };
  };
  resources: {
    files?: string[];
    links?: string[];
    references?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Quiz Question structure
export interface QuizQuestion {
  id: string;
  type: AssessmentType;
  question: string;
  options?: string[]; // for multiple choice, true/false
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: DifficultyLevel;
  bloomLevel: BloomLevel;
  tags: string[];
  feedback: {
    correct: string;
    incorrect: string;
    partial?: string;
  };
}

// Assessment structure
export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: "formative" | "summative" | "diagnostic";
  questions: QuizQuestion[];
  settings: {
    timeLimit?: number; // in minutes
    attempts: number;
    passingScore: number; // percentage
    randomizeQuestions: boolean;
    showFeedback: boolean;
    allowReview: boolean;
  };
  learningObjectives: string[]; // references to LearningObjective IDs
  totalPoints: number;
  estimatedTime: number;
  createdAt: Date;
  updatedAt: Date;
}

// Lesson structure
export interface Lesson {
  id: string;
  title: string;
  description: string;
  learningObjectives: LearningObjective[];
  contentBlocks: ContentBlock[];
  assessments: Assessment[];
  prerequisites: string[]; // references to other lesson IDs
  estimatedDuration: number; // in minutes
  difficulty: DifficultyLevel;
  tags: string[];
  metadata: {
    author: string;
    version: string;
    language: string;
    lastReviewed: Date;
  };
  sequencing: {
    isRequired: boolean;
    order: number;
    dependencies: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Learning Module structure
export interface LearningModule {
  id: string;
  title: string;
  description: string;
  overview: string;
  learningObjectives: LearningObjective[];
  lessons: Lesson[];
  finalAssessment?: Assessment;
  prerequisites: string[]; // references to other module IDs
  estimatedDuration: number; // in minutes
  difficulty: DifficultyLevel;
  targetAudience: string;
  subject: string;
  tags: string[];
  metadata: {
    author: string;
    version: string;
    language: string;
    lastReviewed: Date;
    accreditation?: string;
  };
  settings: {
    allowNonLinearProgression: boolean;
    requireCompletionOrder: boolean;
    certificateEligible: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Course structure (collection of modules)
export interface Course {
  id: string;
  title: string;
  description: string;
  overview: string;
  modules: LearningModule[];
  globalLearningObjectives: LearningObjective[];
  prerequisites: string[];
  estimatedDuration: number; // in minutes
  difficulty: DifficultyLevel;
  targetAudience: string;
  subject: string;
  category: string;
  tags: string[];
  metadata: {
    author: string;
    institution?: string;
    version: string;
    language: string;
    lastReviewed: Date;
    accreditation?: string;
    certification?: {
      available: boolean;
      requirements: string[];
      validityPeriod?: number; // in months
    };
  };
  settings: {
    enrollmentOpen: boolean;
    selfPaced: boolean;
    allowNonLinearProgression: boolean;
    requireCompletionOrder: boolean;
    discussionEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Progress tracking structures
export interface LearnerProgress {
  learnerId: string;
  courseId: string;
  moduleProgress: {
    [moduleId: string]: {
      status: "not_started" | "in_progress" | "completed";
      completionPercentage: number;
      timeSpent: number; // in minutes
      lastAccessed: Date;
      lessonProgress: {
        [lessonId: string]: {
          status: "not_started" | "in_progress" | "completed";
          completionPercentage: number;
          timeSpent: number;
          lastAccessed: Date;
          contentBlockProgress: {
            [blockId: string]: {
              viewed: boolean;
              timeSpent: number;
              interactions: number;
            };
          };
        };
      };
    };
  };
  assessmentResults: {
    [assessmentId: string]: {
      attempts: number;
      bestScore: number;
      lastScore: number;
      passed: boolean;
      completedAt: Date[];
      timeSpent: number;
    };
  };
  overallProgress: {
    status: "not_started" | "in_progress" | "completed";
    completionPercentage: number;
    totalTimeSpent: number;
    startedAt?: Date;
    completedAt?: Date;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    earnedAt: Date;
  }[];
}

// Learning Path structure for personalized learning
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[]; // references to Course IDs
  recommendedSequence: string[];
  adaptiveRules: {
    prerequisiteCheck: boolean;
    difficultyAdjustment: boolean;
    personalizedRecommendations: boolean;
  };
  targetAudience: string;
  estimatedDuration: number;
  createdAt: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const LearningObjectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
  measurableOutcome: z.string(),
  assessmentCriteria: z.array(z.string()),
  prerequisites: z.array(z.string()),
  estimatedTime: z.number().positive(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ContentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "video", "audio", "image", "interactive", "simulation", "quiz", "assignment"]),
  title: z.string(),
  content: z.string(),
  metadata: z.object({
    duration: z.number().positive().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    learningStyles: z.array(z.enum(["visual", "auditory", "kinesthetic", "reading_writing"])),
    interactionLevel: z.enum(["passive", "active", "interactive"]),
    accessibility: z.object({
      altText: z.string().optional(),
      captions: z.boolean().optional(),
      transcription: z.boolean().optional(),
    }).optional(),
  }),
  resources: z.object({
    files: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
    references: z.array(z.string()).optional(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer", "essay", "practical", "peer_review"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string(),
  points: z.number().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
  tags: z.array(z.string()),
  feedback: z.object({
    correct: z.string(),
    incorrect: z.string(),
    partial: z.string().optional(),
  }),
});

export const AssessmentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(["formative", "summative", "diagnostic"]),
  questions: z.array(QuizQuestionSchema),
  settings: z.object({
    timeLimit: z.number().positive().optional(),
    attempts: z.number().positive(),
    passingScore: z.number().min(0).max(100),
    randomizeQuestions: z.boolean(),
    showFeedback: z.boolean(),
    allowReview: z.boolean(),
  }),
  learningObjectives: z.array(z.string()),
  totalPoints: z.number().positive(),
  estimatedTime: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(LearningObjectiveSchema),
  contentBlocks: z.array(ContentBlockSchema),
  assessments: z.array(AssessmentSchema),
  prerequisites: z.array(z.string()),
  estimatedDuration: z.number().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  tags: z.array(z.string()),
  metadata: z.object({
    author: z.string(),
    version: z.string(),
    language: z.string(),
    lastReviewed: z.date(),
  }),
  sequencing: z.object({
    isRequired: z.boolean(),
    order: z.number(),
    dependencies: z.array(z.string()),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LearningModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  overview: z.string(),
  learningObjectives: z.array(LearningObjectiveSchema),
  lessons: z.array(LessonSchema),
  finalAssessment: AssessmentSchema.optional(),
  prerequisites: z.array(z.string()),
  estimatedDuration: z.number().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  targetAudience: z.string(),
  subject: z.string(),
  tags: z.array(z.string()),
  metadata: z.object({
    author: z.string(),
    version: z.string(),
    language: z.string(),
    lastReviewed: z.date(),
    accreditation: z.string().optional(),
  }),
  settings: z.object({
    allowNonLinearProgression: z.boolean(),
    requireCompletionOrder: z.boolean(),
    certificateEligible: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  overview: z.string(),
  modules: z.array(LearningModuleSchema),
  globalLearningObjectives: z.array(LearningObjectiveSchema),
  prerequisites: z.array(z.string()),
  estimatedDuration: z.number().positive(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  targetAudience: z.string(),
  subject: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  metadata: z.object({
    author: z.string(),
    institution: z.string().optional(),
    version: z.string(),
    language: z.string(),
    lastReviewed: z.date(),
    accreditation: z.string().optional(),
    certification: z.object({
      available: z.boolean(),
      requirements: z.array(z.string()),
      validityPeriod: z.number().optional(),
    }).optional(),
  }),
  settings: z.object({
    enrollmentOpen: z.boolean(),
    selfPaced: z.boolean(),
    allowNonLinearProgression: z.boolean(),
    requireCompletionOrder: z.boolean(),
    discussionEnabled: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});
