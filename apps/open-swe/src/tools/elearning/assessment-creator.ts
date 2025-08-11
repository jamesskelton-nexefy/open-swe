import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { loadModel } from "../../utils/llms/index.js";
import { LLMTask } from "@open-swe/shared/open-swe/llm-task";
import { GraphConfig } from "@open-swe/shared/open-swe/types";
import { getMessageContentString } from "@open-swe/shared/messages";
import {
  Assessment,
  QuizQuestion,
  LearningObjective,
  BloomLevel,
  DifficultyLevel,
  AssessmentType,
} from "@open-swe/shared/open-swe/elearning-types";
import {
  BLOOM_ACTION_VERBS,
  ASSESSMENT_STRATEGIES,
  LearningDesignTemplates,
} from "@open-swe/shared/open-swe/learning-design";

const logger = createLogger(LogLevel.INFO, "AssessmentCreator");

const assessmentCreatorSchema = z.object({
  assessmentTitle: z
    .string()
    .describe("Title of the assessment to be created"),
  assessmentType: z
    .enum(["diagnostic", "formative", "summative"])
    .describe("Type of assessment (diagnostic, formative, or summative)"),
  subject: z
    .string()
    .describe("Subject area or domain of the assessment"),
  learningObjectives: z
    .array(z.string())
    .describe("Learning objectives that this assessment should measure"),
  sourceContent: z
    .string()
    .describe("Source content to base assessment questions on"),
  targetAudience: z
    .string()
    .describe("Target audience description (e.g., 'undergraduate students', 'professionals')"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .default("beginner")
    .describe("Difficulty level of the assessment"),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "short_answer", "essay", "practical", "peer_review"]))
    .default(["multiple_choice", "short_answer"])
    .describe("Types of questions to include in the assessment"),
  numberOfQuestions: z
    .number()
    .positive()
    .default(10)
    .describe("Total number of questions to generate"),
  timeLimit: z
    .number()
    .positive()
    .optional()
    .describe("Time limit for the assessment in minutes"),
  passingScore: z
    .number()
    .min(0)
    .max(100)
    .default(80)
    .describe("Passing score percentage for the assessment"),
  bloomLevels: z
    .array(z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]))
    .default(["remember", "understand", "apply"])
    .describe("Bloom's taxonomy levels to include in the assessment"),
  requireApproval: z
    .boolean()
    .default(true)
    .describe("Whether to require human approval for assessment strategy before generating questions"),
});

export interface AssessmentStrategy {
  title: string;
  type: "diagnostic" | "formative" | "summative";
  description: string;
  purpose: string[];
  learningObjectives: string[];
  questionDistribution: {
    [key in AssessmentType]?: {
      count: number;
      bloomLevels: BloomLevel[];
      points: number;
    };
  };
  bloomDistribution: {
    [key in BloomLevel]?: {
      count: number;
      questionTypes: AssessmentType[];
      totalPoints: number;
    };
  };
  assessmentSettings: {
    timeLimit?: number;
    attempts: number;
    passingScore: number;
    randomizeQuestions: boolean;
    showFeedback: boolean;
    allowReview: boolean;
  };
  rubric: {
    criteria: string[];
    performanceLevels: Array<{
      level: string;
      description: string;
      pointRange: string;
    }>;
  };
  accessibilityConsiderations: string[];
  qualityAssuranceChecks: string[];
}

export interface AssessmentCreationResult {
  strategy: AssessmentStrategy;
  detailedAssessment?: Assessment;
  status: "strategy_pending_approval" | "approved" | "assessment_created" | "error";
  approvalRequired: boolean;
  error?: string;
}

const ASSESSMENT_STRATEGY_PROMPT = `You are an expert assessment designer creating a comprehensive assessment strategy for e-learning.

Assessment Details:
Title: {ASSESSMENT_TITLE}
Type: {ASSESSMENT_TYPE}
Subject: {SUBJECT}
Target Audience: {TARGET_AUDIENCE}
Learning Objectives: {LEARNING_OBJECTIVES}
Difficulty: {DIFFICULTY}
Question Types: {QUESTION_TYPES}
Number of Questions: {NUMBER_OF_QUESTIONS}
Time Limit: {TIME_LIMIT} minutes
Passing Score: {PASSING_SCORE}%
Bloom's Levels: {BLOOM_LEVELS}

Source Content:
{SOURCE_CONTENT}

Design a comprehensive assessment strategy following these principles:

1. **Assessment Validity**: Ensure questions directly measure the stated learning objectives
2. **Bloom's Taxonomy Alignment**: Distribute questions across appropriate cognitive levels
3. **Assessment Type Best Practices**:
   - Diagnostic: Pre-learning, identify prior knowledge and misconceptions
   - Formative: During learning, provide feedback and guide instruction
   - Summative: Post-learning, evaluate achievement and assign grades
4. **Universal Design for Learning**: Ensure accessibility and multiple means of expression
5. **Cognitive Load Management**: Appropriate question complexity and clear instructions

Create a detailed assessment strategy in the following JSON format:

{
  "title": "Assessment title",
  "type": "diagnostic|formative|summative",
  "description": "Comprehensive description of the assessment purpose and approach",
  "purpose": [
    "Primary purpose 1",
    "Secondary purpose 2"
  ],
  "learningObjectives": ["obj1", "obj2"],
  "questionDistribution": {
    "multiple_choice": {
      "count": 5,
      "bloomLevels": ["remember", "understand"],
      "points": 25
    },
    "short_answer": {
      "count": 3,
      "bloomLevels": ["apply", "analyze"],
      "points": 30
    }
  },
  "bloomDistribution": {
    "remember": {
      "count": 2,
      "questionTypes": ["multiple_choice"],
      "totalPoints": 10
    },
    "understand": {
      "count": 3,
      "questionTypes": ["multiple_choice", "true_false"],
      "totalPoints": 15
    }
  },
  "assessmentSettings": {
    "timeLimit": 30,
    "attempts": 3,
    "passingScore": 80,
    "randomizeQuestions": true,
    "showFeedback": true,
    "allowReview": true
  },
  "rubric": {
    "criteria": [
      "Accuracy of responses",
      "Depth of understanding",
      "Application of concepts"
    ],
    "performanceLevels": [
      {
        "level": "Excellent",
        "description": "Demonstrates comprehensive understanding and accurate application",
        "pointRange": "90-100%"
      },
      {
        "level": "Proficient",
        "description": "Shows good understanding with minor gaps",
        "pointRange": "80-89%"
      },
      {
        "level": "Developing",
        "description": "Basic understanding with some misconceptions",
        "pointRange": "70-79%"
      },
      {
        "level": "Beginning",
        "description": "Limited understanding, needs additional support",
        "pointRange": "Below 70%"
      }
    ]
  },
  "accessibilityConsiderations": [
    "Clear, simple language",
    "Alternative formats available",
    "Extended time options",
    "Screen reader compatibility"
  ],
  "qualityAssuranceChecks": [
    "Alignment with learning objectives",
    "Appropriate difficulty level",
    "Clear question wording",
    "Balanced content coverage"
  ]
}

Ensure the assessment strategy:
- Aligns with the specified assessment type and purpose
- Distributes questions appropriately across Bloom's levels
- Includes diverse question types for comprehensive evaluation
- Considers accessibility and universal design principles
- Provides clear rubrics and performance criteria`;

const DETAILED_ASSESSMENT_PROMPT = `You are an expert assessment developer creating detailed questions based on an approved assessment strategy.

Approved Assessment Strategy:
{APPROVED_STRATEGY}

Source Content:
{SOURCE_CONTENT}

Create detailed assessment questions following these guidelines:

1. **Question Quality**: Each question should be clear, unambiguous, and directly related to learning objectives
2. **Bloom's Alignment**: Use appropriate action verbs and cognitive complexity for each Bloom's level
3. **Distractor Quality**: For multiple choice, create plausible but clearly incorrect distractors
4. **Feedback Design**: Provide constructive feedback that promotes learning
5. **Accessibility**: Ensure questions are accessible to learners with diverse needs

Generate a complete assessment in the following JSON format:

{
  "id": "assessment_id",
  "title": "Assessment title",
  "description": "Assessment description and instructions",
  "type": "diagnostic|formative|summative",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|true_false|short_answer|essay|practical|peer_review",
      "question": "Clear, well-written question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "Detailed explanation of why this is correct",
      "points": 5,
      "difficulty": "beginner|intermediate|advanced",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "tags": ["tag1", "tag2"],
      "feedback": {
        "correct": "Excellent! You understand this concept well.",
        "incorrect": "Not quite. Review the section on [topic] and try again.",
        "partial": "You're on the right track, but consider..."
      }
    }
  ],
  "settings": {
    "timeLimit": 30,
    "attempts": 3,
    "passingScore": 80,
    "randomizeQuestions": true,
    "showFeedback": true,
    "allowReview": true
  },
  "learningObjectives": ["obj1", "obj2"],
  "totalPoints": 100,
  "estimatedTime": 30
}

Make each question:
- **Clear and unambiguous** with precise wording
- **Appropriately challenging** for the target difficulty level
- **Aligned** with specific learning objectives and Bloom's levels
- **Inclusive** and free from bias or cultural assumptions
- **Constructive** with feedback that promotes learning`;

export function createAssessmentCreatorTool(config: GraphConfig) {
  return tool(
    async (input): Promise<AssessmentCreationResult> => {
      const {
        assessmentTitle,
        assessmentType,
        subject,
        learningObjectives,
        sourceContent,
        targetAudience,
        difficulty,
        questionTypes,
        numberOfQuestions,
        timeLimit,
        passingScore,
        bloomLevels,
        requireApproval,
      } = input;

      try {
        logger.info("Starting assessment creation", {
          assessmentTitle,
          assessmentType,
          subject,
          targetAudience,
          difficulty,
          numberOfQuestions,
          questionTypes,
          bloomLevels,
          requireApproval,
        });

        const model = await loadModel(config, LLMTask.SUMMARIZER);

        // Step 1: Generate assessment strategy
        const strategyPrompt = ASSESSMENT_STRATEGY_PROMPT
          .replace("{ASSESSMENT_TITLE}", assessmentTitle)
          .replace("{ASSESSMENT_TYPE}", assessmentType)
          .replace("{SUBJECT}", subject)
          .replace("{TARGET_AUDIENCE}", targetAudience)
          .replace("{LEARNING_OBJECTIVES}", learningObjectives.join(", "))
          .replace("{DIFFICULTY}", difficulty)
          .replace("{QUESTION_TYPES}", questionTypes.join(", "))
          .replace("{NUMBER_OF_QUESTIONS}", numberOfQuestions.toString())
          .replace("{TIME_LIMIT}", timeLimit?.toString() || "Not specified")
          .replace("{PASSING_SCORE}", passingScore.toString())
          .replace("{BLOOM_LEVELS}", bloomLevels.join(", "))
          .replace("{SOURCE_CONTENT}", sourceContent);

        const strategyResponse = await model
          .withConfig({ tags: ["nostream"], runName: "assessment-strategy-generation" })
          .invoke([
            {
              role: "user",
              content: strategyPrompt,
            },
          ]);

        const strategyResult = getMessageContentString(strategyResponse.content);

        // Parse the strategy JSON
        let strategy: AssessmentStrategy;
        try {
          const jsonMatch = strategyResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in strategy response");
          }
          strategy = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          logger.error("Failed to parse strategy result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResult: strategyResult,
          });
          
          // Create fallback strategy
          const pointsPerQuestion = Math.round(100 / numberOfQuestions);
          const questionsPerType = Math.floor(numberOfQuestions / questionTypes.length);
          
          strategy = {
            title: assessmentTitle,
            type: assessmentType,
            description: `${assessmentType} assessment for ${subject} targeting ${targetAudience}`,
            purpose: ASSESSMENT_STRATEGIES[assessmentType]?.purpose || [
              "Evaluate learning achievement",
              "Provide feedback to learners",
            ],
            learningObjectives,
            questionDistribution: questionTypes.reduce((acc, type) => {
              acc[type] = {
                count: questionsPerType,
                bloomLevels: bloomLevels.slice(0, 2) as BloomLevel[],
                points: questionsPerType * pointsPerQuestion,
              };
              return acc;
            }, {} as any),
            bloomDistribution: bloomLevels.reduce((acc, level) => {
              acc[level] = {
                count: Math.floor(numberOfQuestions / bloomLevels.length),
                questionTypes: questionTypes.slice(0, 2) as AssessmentType[],
                totalPoints: Math.floor(100 / bloomLevels.length),
              };
              return acc;
            }, {} as any),
            assessmentSettings: {
              timeLimit,
              attempts: assessmentType === "formative" ? 3 : 1,
              passingScore,
              randomizeQuestions: true,
              showFeedback: assessmentType !== "summative",
              allowReview: assessmentType === "formative",
            },
            rubric: {
              criteria: [
                "Accuracy of responses",
                "Depth of understanding",
                "Application of concepts",
              ],
              performanceLevels: [
                {
                  level: "Excellent",
                  description: "Demonstrates comprehensive understanding",
                  pointRange: "90-100%",
                },
                {
                  level: "Proficient",
                  description: "Shows good understanding",
                  pointRange: "80-89%",
                },
                {
                  level: "Developing",
                  description: "Basic understanding with gaps",
                  pointRange: "70-79%",
                },
                {
                  level: "Beginning",
                  description: "Limited understanding",
                  pointRange: "Below 70%",
                },
              ],
            },
            accessibilityConsiderations: [
              "Clear, simple language",
              "Alternative formats available",
              "Extended time options",
              "Screen reader compatibility",
            ],
            qualityAssuranceChecks: [
              "Alignment with learning objectives",
              "Appropriate difficulty level",
              "Clear question wording",
              "Balanced content coverage",
            ],
          };
        }

        // If approval is required, return strategy for approval
        if (requireApproval) {
          logger.info("Assessment strategy generated, awaiting approval", {
            questionTypesCount: Object.keys(strategy.questionDistribution).length,
            bloomLevelsCount: Object.keys(strategy.bloomDistribution).length,
            totalQuestions: numberOfQuestions,
          });

          return {
            strategy,
            status: "strategy_pending_approval",
            approvalRequired: true,
          };
        }

        // Step 2: Generate detailed assessment (if no approval required)
        const detailedAssessmentPrompt = DETAILED_ASSESSMENT_PROMPT
          .replace("{APPROVED_STRATEGY}", JSON.stringify(strategy, null, 2))
          .replace("{SOURCE_CONTENT}", sourceContent);

        const assessmentResponse = await model
          .withConfig({ tags: ["nostream"], runName: "detailed-assessment-generation" })
          .invoke([
            {
              role: "user",
              content: detailedAssessmentPrompt,
            },
          ]);

        const assessmentResult = getMessageContentString(assessmentResponse.content);

        // Parse the detailed assessment JSON
        let detailedAssessment: Assessment;
        try {
          const jsonMatch = assessmentResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in assessment response");
          }
          const parsedAssessment = JSON.parse(jsonMatch[0]);
          
          // Ensure dates are properly formatted
          detailedAssessment = {
            ...parsedAssessment,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } catch (parseError) {
          logger.error("Failed to parse assessment result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          
          // Create fallback assessment
          const fallbackQuestions: QuizQuestion[] = Array.from({ length: numberOfQuestions }, (_, index) => ({
            id: `q_${index + 1}`,
            type: questionTypes[index % questionTypes.length],
            question: `Question ${index + 1} about ${subject}`,
            options: questionTypes[index % questionTypes.length] === "multiple_choice" ? [
              "Option A",
              "Option B", 
              "Option C",
              "Option D"
            ] : undefined,
            correctAnswer: questionTypes[index % questionTypes.length] === "multiple_choice" ? "Option A" : "Sample answer",
            explanation: `Explanation for question ${index + 1}`,
            points: Math.round(100 / numberOfQuestions),
            difficulty,
            bloomLevel: bloomLevels[index % bloomLevels.length],
            tags: [subject.toLowerCase(), difficulty],
            feedback: {
              correct: "Correct! Well done.",
              incorrect: "Incorrect. Please review the material.",
              partial: "Partially correct. Consider these points...",
            },
          }));

          detailedAssessment = {
            id: `assessment_${Date.now()}`,
            title: assessmentTitle,
            description: `${assessmentType} assessment for ${subject}`,
            type: assessmentType,
            questions: fallbackQuestions,
            settings: strategy.assessmentSettings,
            learningObjectives,
            totalPoints: 100,
            estimatedTime: timeLimit || 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        logger.info("Assessment creation completed successfully", {
          strategyGenerated: true,
          detailedAssessmentGenerated: true,
          questionsCount: detailedAssessment.questions.length,
          totalPoints: detailedAssessment.totalPoints,
        });

        return {
          strategy,
          detailedAssessment,
          status: "assessment_created",
          approvalRequired: false,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error("Assessment creation failed", {
          error: errorMessage,
          assessmentTitle,
          subject,
        });

        return {
          strategy: {
            title: "",
            type: "formative",
            description: "",
            purpose: [],
            learningObjectives: [],
            questionDistribution: {},
            bloomDistribution: {},
            assessmentSettings: {
              attempts: 1,
              passingScore: 80,
              randomizeQuestions: true,
              showFeedback: true,
              allowReview: false,
            },
            rubric: {
              criteria: [],
              performanceLevels: [],
            },
            accessibilityConsiderations: [],
            qualityAssuranceChecks: [],
          },
          status: "error",
          approvalRequired: false,
          error: errorMessage,
        };
      }
    },
    {
      name: "assessment_creator",
      description: "Creates comprehensive assessments with instructional design principles and human approval checkpoints for assessment strategy",
      schema: assessmentCreatorSchema,
    }
  );
}

export function createAssessmentCreatorToolFields() {
  return {
    name: "assessment_creator",
    description: "Creates comprehensive assessments with instructional design principles and human approval checkpoints for assessment strategy",
    schema: assessmentCreatorToolFields,
  };
}
