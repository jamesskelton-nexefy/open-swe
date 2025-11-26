import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { loadModel } from "../../utils/llms/index.js";
import { LLMTask } from "@open-swe/shared/open-swe/llm-task";
import { GraphConfig } from "@open-swe/shared/open-swe/types";
import { getMessageContentString } from "@open-swe/shared/messages";
import {
  Lesson,
  LearningObjective,
  ContentBlock,
  Assessment,
  BloomLevel,
  DifficultyLevel,
  LearningStyle,
  ContentType,
} from "@open-swe/shared/open-swe/elearning-types";
import {
  BLOOM_ACTION_VERBS,
  LEARNING_STYLE_TEMPLATES,
  PEDAGOGICAL_APPROACHES,
  LearningDesignTemplates,
} from "@open-swe/shared/open-swe/learning-design";

const logger = createLogger(LogLevel.INFO, "LessonBuilder");

const lessonBuilderSchema = z.object({
  lessonTitle: z
    .string()
    .describe("Title of the lesson to be created"),
  subject: z
    .string()
    .describe("Subject area or domain of the lesson"),
  targetAudience: z
    .string()
    .describe("Target audience description (e.g., 'undergraduate students', 'professionals')"),
  sourceContent: z
    .string()
    .describe("Source content to base the lesson on (PDF text, existing materials, etc.)"),
  learningObjectives: z
    .array(z.string())
    .describe("List of learning objectives for this lesson"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .default("beginner")
    .describe("Difficulty level of the lesson"),
  estimatedDuration: z
    .number()
    .positive()
    .default(45)
    .describe("Estimated duration in minutes for the lesson"),
  pedagogicalApproach: z
    .enum(["constructivist", "behaviorist", "cognitivist", "experiential"])
    .default("constructivist")
    .describe("Pedagogical approach to use for lesson design"),
  preferredLearningStyles: z
    .array(z.enum(["visual", "auditory", "kinesthetic", "reading_writing"]))
    .default(["visual", "reading_writing"])
    .describe("Preferred learning styles to accommodate"),
  includeAssessments: z
    .boolean()
    .default(true)
    .describe("Whether to include formative and summative assessments"),
  requireApproval: z
    .boolean()
    .default(true)
    .describe("Whether to require human approval for lesson structure before detailed content creation"),
});

export interface LessonStructure {
  title: string;
  description: string;
  overview: string;
  learningObjectives: LearningObjective[];
  prerequisites: string[];
  estimatedDuration: number;
  difficulty: DifficultyLevel;
  contentStructure: {
    introduction: {
      title: string;
      description: string;
      duration: number;
      activities: string[];
    };
    mainContent: Array<{
      sectionTitle: string;
      description: string;
      contentType: ContentType;
      duration: number;
      bloomLevel: BloomLevel;
      learningStyles: LearningStyle[];
      activities: string[];
      keyPoints: string[];
    }>;
    conclusion: {
      title: string;
      description: string;
      duration: number;
      activities: string[];
    };
  };
  assessmentPlan: {
    formativeAssessments: Array<{
      title: string;
      type: string;
      timing: string;
      purpose: string;
    }>;
    summativeAssessment?: {
      title: string;
      type: string;
      timing: string;
      criteria: string[];
    };
  };
  instructionalStrategies: string[];
  engagementTechniques: string[];
  accessibilityConsiderations: string[];
}

export interface LessonBuildResult {
  structure: LessonStructure;
  detailedLesson?: Lesson;
  status: "structure_pending_approval" | "approved" | "lesson_built" | "error";
  approvalRequired: boolean;
  error?: string;
}

const LESSON_STRUCTURE_PROMPT = `You are an expert instructional designer creating a comprehensive lesson structure for e-learning.

Lesson Details:
Title: {LESSON_TITLE}
Subject: {SUBJECT}
Target Audience: {TARGET_AUDIENCE}
Learning Objectives: {LEARNING_OBJECTIVES}
Difficulty: {DIFFICULTY}
Duration: {DURATION} minutes
Pedagogical Approach: {PEDAGOGICAL_APPROACH}
Learning Styles: {LEARNING_STYLES}

Source Content:
{SOURCE_CONTENT}

Design a comprehensive lesson structure following these principles:

1. **ADDIE Model**: Proper analysis and design phase considerations
2. **Bloom's Taxonomy**: Progressive cognitive development from lower to higher order thinking
3. **Gagne's Nine Events of Instruction**:
   - Gain attention
   - Inform learners of objectives
   - Stimulate recall of prior learning
   - Present content
   - Provide learning guidance
   - Elicit performance
   - Provide feedback
   - Assess performance
   - Enhance retention and transfer

4. **Universal Design for Learning**: Multiple means of representation, engagement, and expression
5. **Cognitive Load Theory**: Appropriate chunking and scaffolding

Create a detailed lesson structure in the following JSON format:

{
  "title": "Engaging lesson title",
  "description": "Brief description of what the lesson covers",
  "overview": "Comprehensive overview of the lesson content and approach",
  "learningObjectives": [
    {
      "id": "obj_1",
      "title": "Objective title",
      "description": "Clear, measurable objective using action verbs",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "measurableOutcome": "Specific measurable outcome",
      "assessmentCriteria": ["criterion1", "criterion2"],
      "prerequisites": ["prerequisite1"],
      "estimatedTime": 10,
      "tags": ["tag1", "tag2"]
    }
  ],
  "prerequisites": ["Prior knowledge or skills needed"],
  "estimatedDuration": 45,
  "difficulty": "beginner|intermediate|advanced",
  "contentStructure": {
    "introduction": {
      "title": "Lesson Introduction",
      "description": "Hook learners and set expectations",
      "duration": 5,
      "activities": ["Attention-grabbing opener", "Learning objectives presentation", "Lesson roadmap"]
    },
    "mainContent": [
      {
        "sectionTitle": "Section title",
        "description": "What this section covers",
        "contentType": "text|video|audio|image|interactive|simulation|quiz|assignment",
        "duration": 15,
        "bloomLevel": "understand",
        "learningStyles": ["visual", "reading_writing"],
        "activities": ["Activity 1", "Activity 2"],
        "keyPoints": ["Key point 1", "Key point 2"]
      }
    ],
    "conclusion": {
      "title": "Lesson Wrap-up",
      "description": "Summarize and reinforce learning",
      "duration": 5,
      "activities": ["Key points summary", "Next steps preview", "Reflection prompt"]
    }
  },
  "assessmentPlan": {
    "formativeAssessments": [
      {
        "title": "Knowledge Check",
        "type": "Quick quiz",
        "timing": "Mid-lesson",
        "purpose": "Check understanding before proceeding"
      }
    ],
    "summativeAssessment": {
      "title": "Lesson Assessment",
      "type": "Comprehensive quiz",
      "timing": "End of lesson",
      "criteria": ["Accuracy", "Understanding", "Application"]
    }
  },
  "instructionalStrategies": [
    "Strategy based on pedagogical approach",
    "Engagement techniques",
    "Scaffolding methods"
  ],
  "engagementTechniques": [
    "Interactive elements",
    "Real-world examples",
    "Multimedia integration"
  ],
  "accessibilityConsiderations": [
    "Alternative text for images",
    "Captions for videos",
    "Multiple content formats"
  ]
}

Ensure the lesson structure:
- Follows the selected pedagogical approach
- Accommodates the specified learning styles
- Includes appropriate assessment strategies
- Maintains cognitive load balance
- Provides clear progression from simple to complex concepts`;

const DETAILED_LESSON_PROMPT = `You are an expert content developer creating a detailed lesson based on an approved structure.

Approved Lesson Structure:
{APPROVED_STRUCTURE}

Source Content:
{SOURCE_CONTENT}

Create a complete lesson with detailed content blocks and assessments. Follow these guidelines:

1. **Content Development**: Create engaging, interactive content for each section
2. **Assessment Integration**: Include formative and summative assessments as planned
3. **Accessibility**: Ensure content is accessible to all learners
4. **Engagement**: Use varied content types and interactive elements
5. **Alignment**: Ensure all content aligns with learning objectives

Generate a complete lesson in the following JSON format:

{
  "id": "lesson_id",
  "title": "Lesson title",
  "description": "Lesson description",
  "learningObjectives": [/* Learning objectives from structure */],
  "contentBlocks": [
    {
      "id": "block_id",
      "type": "text|video|audio|image|interactive|simulation|quiz|assignment",
      "title": "Content block title",
      "content": "Detailed content - HTML, markdown, or structured data",
      "metadata": {
        "duration": 10,
        "difficulty": "beginner|intermediate|advanced",
        "learningStyles": ["visual", "auditory"],
        "interactionLevel": "passive|active|interactive",
        "accessibility": {
          "altText": "Alt text for images",
          "captions": true,
          "transcription": true
        }
      },
      "resources": {
        "files": ["resource.pdf"],
        "links": ["https://example.com"],
        "references": ["Reference citation"]
      }
    }
  ],
  "assessments": [
    {
      "id": "assessment_id",
      "title": "Assessment title",
      "description": "Assessment description",
      "type": "formative|summative|diagnostic",
      "questions": [/* Quiz questions */],
      "settings": {
        "timeLimit": 15,
        "attempts": 3,
        "passingScore": 80,
        "randomizeQuestions": true,
        "showFeedback": true,
        "allowReview": true
      },
      "learningObjectives": ["obj_1"],
      "totalPoints": 100,
      "estimatedTime": 15
    }
  ],
  "prerequisites": ["Prerequisites from structure"],
  "estimatedDuration": 45,
  "difficulty": "beginner|intermediate|advanced",
  "tags": ["subject", "difficulty", "approach"],
  "metadata": {
    "author": "System Generated",
    "version": "1.0",
    "language": "en",
    "lastReviewed": "2024-01-01T00:00:00.000Z"
  },
  "sequencing": {
    "isRequired": true,
    "order": 1,
    "dependencies": []
  }
}

Make the lesson:
- **Engaging** with varied content types and interactions
- **Progressive** building from simple to complex concepts
- **Practical** with real-world examples and applications
- **Accessible** to learners with different abilities and learning styles
- **Aligned** with all learning objectives and assessment criteria`;

export function createLessonBuilderTool(config: GraphConfig) {
  return tool(
    async (input): Promise<LessonBuildResult> => {
      const {
        lessonTitle,
        subject,
        targetAudience,
        sourceContent,
        learningObjectives,
        difficulty,
        estimatedDuration,
        pedagogicalApproach,
        preferredLearningStyles,
        includeAssessments,
        requireApproval,
      } = input;

      try {
        logger.info("Starting lesson building", {
          lessonTitle,
          subject,
          targetAudience,
          difficulty,
          duration: estimatedDuration,
          pedagogicalApproach,
          includeAssessments,
          requireApproval,
        });

        const model = await loadModel(config, LLMTask.SUMMARIZER);

        // Step 1: Generate lesson structure
        const structurePrompt = LESSON_STRUCTURE_PROMPT
          .replace("{LESSON_TITLE}", lessonTitle)
          .replace("{SUBJECT}", subject)
          .replace("{TARGET_AUDIENCE}", targetAudience)
          .replace("{LEARNING_OBJECTIVES}", learningObjectives.join(", "))
          .replace("{DIFFICULTY}", difficulty)
          .replace("{DURATION}", estimatedDuration.toString())
          .replace("{PEDAGOGICAL_APPROACH}", pedagogicalApproach)
          .replace("{LEARNING_STYLES}", preferredLearningStyles.join(", "))
          .replace("{SOURCE_CONTENT}", sourceContent);

        const structureResponse = await model
          .withConfig({ tags: ["nostream"], runName: "lesson-structure-generation" })
          .invoke([
            {
              role: "user",
              content: structurePrompt,
            },
          ]);

        const structureResult = getMessageContentString(structureResponse.content);

        // Parse the structure JSON
        let structure: LessonStructure;
        try {
          const jsonMatch = structureResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in structure response");
          }
          structure = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          logger.error("Failed to parse structure result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResult: structureResult,
          });
          
          // Create fallback structure
          structure = {
            title: lessonTitle,
            description: `Comprehensive lesson on ${subject} for ${targetAudience}`,
            overview: `This lesson covers key concepts in ${subject} using a ${pedagogicalApproach} approach`,
            learningObjectives: learningObjectives.map((obj, index) => ({
              id: `obj_${index + 1}`,
              title: obj,
              description: obj,
              bloomLevel: "understand" as BloomLevel,
              measurableOutcome: `Successfully demonstrate ${obj}`,
              assessmentCriteria: ["Demonstrates understanding", "Applies concepts correctly"],
              prerequisites: [],
              estimatedTime: Math.round(estimatedDuration / learningObjectives.length),
              tags: [subject.toLowerCase(), difficulty],
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            prerequisites: [],
            estimatedDuration,
            difficulty,
            contentStructure: {
              introduction: {
                title: "Introduction",
                description: "Welcome and lesson overview",
                duration: Math.round(estimatedDuration * 0.1),
                activities: ["Welcome message", "Learning objectives", "Lesson roadmap"],
              },
              mainContent: [
                {
                  sectionTitle: "Core Concepts",
                  description: `Main concepts of ${subject}`,
                  contentType: "interactive" as ContentType,
                  duration: Math.round(estimatedDuration * 0.7),
                  bloomLevel: "apply" as BloomLevel,
                  learningStyles: preferredLearningStyles,
                  activities: ["Interactive content", "Practice exercises"],
                  keyPoints: ["Key concept 1", "Key concept 2"],
                },
              ],
              conclusion: {
                title: "Summary and Next Steps",
                description: "Lesson wrap-up and preview",
                duration: Math.round(estimatedDuration * 0.2),
                activities: ["Summary", "Reflection", "Next steps"],
              },
            },
            assessmentPlan: {
              formativeAssessments: includeAssessments ? [
                {
                  title: "Knowledge Check",
                  type: "Quick quiz",
                  timing: "Mid-lesson",
                  purpose: "Check understanding",
                },
              ] : [],
              summativeAssessment: includeAssessments ? {
                title: "Lesson Assessment",
                type: "Comprehensive quiz",
                timing: "End of lesson",
                criteria: ["Accuracy", "Understanding", "Application"],
              } : undefined,
            },
            instructionalStrategies: PEDAGOGICAL_APPROACHES[pedagogicalApproach]?.instructionalStrategies || [
              "Interactive content delivery",
              "Progressive skill building",
              "Real-world application",
            ],
            engagementTechniques: [
              "Multimedia integration",
              "Interactive elements",
              "Real-world examples",
            ],
            accessibilityConsiderations: [
              "Alternative text for images",
              "Captions for videos",
              "Multiple content formats",
            ],
          };
        }

        // If approval is required, return structure for approval
        if (requireApproval) {
          logger.info("Lesson structure generated, awaiting approval", {
            sectionsCount: structure.contentStructure.mainContent.length,
            objectivesCount: structure.learningObjectives.length,
            includesAssessments: includeAssessments,
          });

          return {
            structure,
            status: "structure_pending_approval",
            approvalRequired: true,
          };
        }

        // Step 2: Generate detailed lesson (if no approval required)
        const detailedLessonPrompt = DETAILED_LESSON_PROMPT
          .replace("{APPROVED_STRUCTURE}", JSON.stringify(structure, null, 2))
          .replace("{SOURCE_CONTENT}", sourceContent);

        const lessonResponse = await model
          .withConfig({ tags: ["nostream"], runName: "detailed-lesson-generation" })
          .invoke([
            {
              role: "user",
              content: detailedLessonPrompt,
            },
          ]);

        const lessonResult = getMessageContentString(lessonResponse.content);

        // Parse the detailed lesson JSON
        let detailedLesson: Lesson;
        try {
          const jsonMatch = lessonResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in lesson response");
          }
          const parsedLesson = JSON.parse(jsonMatch[0]);
          
          // Ensure dates are properly formatted
          detailedLesson = {
            ...parsedLesson,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {
              ...parsedLesson.metadata,
              lastReviewed: new Date(),
            },
          };
        } catch (parseError) {
          logger.error("Failed to parse lesson result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          
          // Create fallback lesson
          detailedLesson = {
            id: `lesson_${Date.now()}`,
            title: structure.title,
            description: structure.description,
            learningObjectives: structure.learningObjectives,
            contentBlocks: structure.contentStructure.mainContent.map((section, index) => ({
              id: `block_${index + 1}`,
              type: section.contentType,
              title: section.sectionTitle,
              content: `Content for ${section.sectionTitle}: ${section.description}`,
              metadata: {
                duration: section.duration,
                difficulty,
                learningStyles: section.learningStyles,
                interactionLevel: section.contentType === "interactive" ? "interactive" : "active",
              },
              resources: {
                files: [],
                links: [],
                references: [],
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            assessments: [],
            prerequisites: structure.prerequisites,
            estimatedDuration: structure.estimatedDuration,
            difficulty: structure.difficulty,
            tags: [subject.toLowerCase(), difficulty, pedagogicalApproach],
            metadata: {
              author: "System Generated",
              version: "1.0",
              language: "en",
              lastReviewed: new Date(),
            },
            sequencing: {
              isRequired: true,
              order: 1,
              dependencies: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }

        logger.info("Lesson building completed successfully", {
          structureGenerated: true,
          detailedLessonGenerated: true,
          contentBlocksCount: detailedLesson.contentBlocks.length,
          assessmentsCount: detailedLesson.assessments.length,
        });

        return {
          structure,
          detailedLesson,
          status: "lesson_built",
          approvalRequired: false,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error("Lesson building failed", {
          error: errorMessage,
          lessonTitle,
          subject,
        });

        return {
          structure: {
            title: "",
            description: "",
            overview: "",
            learningObjectives: [],
            prerequisites: [],
            estimatedDuration: 0,
            difficulty: "beginner",
            contentStructure: {
              introduction: { title: "", description: "", duration: 0, activities: [] },
              mainContent: [],
              conclusion: { title: "", description: "", duration: 0, activities: [] },
            },
            assessmentPlan: {
              formativeAssessments: [],
            },
            instructionalStrategies: [],
            engagementTechniques: [],
            accessibilityConsiderations: [],
          },
          status: "error",
          approvalRequired: false,
          error: errorMessage,
        };
      }
    },
    {
      name: "lesson_builder",
      description: "Builds comprehensive lessons with instructional design principles and human approval checkpoints for lesson structure",
      schema: lessonBuilderSchema,
    }
  );
}

export function createLessonBuilderToolFields() {
  return {
    name: "lesson_builder",
    description: "Builds comprehensive lessons with instructional design principles and human approval checkpoints for lesson structure",
    schema: lessonBuilderSchema,
  };
}
