import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { loadModel } from "../../utils/llms/index.js";
import { LLMTask } from "@open-swe/shared/open-swe/llm-task";
import { GraphConfig } from "@open-swe/shared/open-swe/types";
import { getMessageContentString } from "@open-swe/shared/messages";
import {
  LearningObjective,
  ContentBlock,
  BloomLevel,
  DifficultyLevel,
  LearningStyle,
  ContentType,
} from "@open-swe/shared/open-swe/elearning-types";
import {
  BLOOM_ACTION_VERBS,
  LEARNING_STYLE_TEMPLATES,
  PEDAGOGICAL_APPROACHES,
} from "@open-swe/shared/open-swe/learning-design";

const logger = createLogger(LogLevel.INFO, "ContentGenerator");

const contentGeneratorSchema = z.object({
  sourceContent: z
    .string()
    .describe("The source content (PDF text, user prompt, or existing material) to generate learning content from"),
  targetAudience: z
    .string()
    .describe("Target audience description (e.g., 'undergraduate students', 'professionals', 'beginners')"),
  subject: z
    .string()
    .describe("Subject area or domain of the content"),
  learningObjectives: z
    .array(z.string())
    .describe("List of learning objectives to address in the generated content"),
  preferredLearningStyles: z
    .array(z.enum(["visual", "auditory", "kinesthetic", "reading_writing"]))
    .default(["visual", "reading_writing"])
    .describe("Preferred learning styles to accommodate"),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .default("beginner")
    .describe("Difficulty level of the content"),
  estimatedDuration: z
    .number()
    .positive()
    .default(30)
    .describe("Estimated duration in minutes for the content"),
  pedagogicalApproach: z
    .enum(["constructivist", "behaviorist", "cognitivist", "experiential"])
    .default("constructivist")
    .describe("Pedagogical approach to use for content generation"),
  requireApproval: z
    .boolean()
    .default(true)
    .describe("Whether to require human approval before generating detailed content"),
});

export interface ContentOutline {
  title: string;
  overview: string;
  learningObjectives: LearningObjective[];
  contentStructure: {
    sections: Array<{
      title: string;
      description: string;
      contentType: ContentType;
      estimatedDuration: number;
      bloomLevel: BloomLevel;
      learningStyles: LearningStyle[];
    }>;
  };
  assessmentStrategy: {
    formativeAssessments: string[];
    summativeAssessment: string;
    assessmentCriteria: string[];
  };
  instructionalDesignNotes: string[];
}

export interface GeneratedContent {
  outline: ContentOutline;
  contentBlocks: ContentBlock[];
  status: "outline_pending_approval" | "approved" | "content_generated" | "error";
  approvalRequired: boolean;
  error?: string;
}

const CONTENT_OUTLINE_PROMPT = `You are an expert instructional designer creating a comprehensive content outline for e-learning materials.

Source Content:
{SOURCE_CONTENT}

Target Audience: {TARGET_AUDIENCE}
Subject: {SUBJECT}
Learning Objectives: {LEARNING_OBJECTIVES}
Preferred Learning Styles: {LEARNING_STYLES}
Difficulty Level: {DIFFICULTY}
Estimated Duration: {DURATION} minutes
Pedagogical Approach: {PEDAGOGICAL_APPROACH}

Create a detailed content outline following these instructional design principles:

1. **ADDIE Model**: Ensure proper analysis, design, development considerations
2. **Bloom's Taxonomy**: Structure objectives from lower to higher cognitive levels
3. **Cognitive Load Theory**: Chunk information appropriately
4. **Universal Design**: Consider accessibility and multiple learning styles
5. **Adult Learning Principles**: Focus on relevance and practical application

Generate a comprehensive outline in the following JSON format:

{
  "title": "Engaging title for the learning content",
  "overview": "Brief overview of what learners will accomplish",
  "learningObjectives": [
    {
      "id": "unique_id",
      "title": "Objective title",
      "description": "Clear, measurable objective using appropriate action verbs",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "measurableOutcome": "Specific measurable outcome",
      "assessmentCriteria": ["criterion1", "criterion2"],
      "prerequisites": ["prerequisite1"],
      "estimatedTime": 15,
      "tags": ["tag1", "tag2"]
    }
  ],
  "contentStructure": {
    "sections": [
      {
        "title": "Section title",
        "description": "What this section covers",
        "contentType": "text|video|audio|image|interactive|simulation|quiz|assignment",
        "estimatedDuration": 10,
        "bloomLevel": "understand",
        "learningStyles": ["visual", "reading_writing"]
      }
    ]
  },
  "assessmentStrategy": {
    "formativeAssessments": ["Quick check questions", "Practice activities"],
    "summativeAssessment": "Final assessment description",
    "assessmentCriteria": ["Criterion 1", "Criterion 2"]
  },
  "instructionalDesignNotes": [
    "Key design considerations",
    "Accessibility notes",
    "Engagement strategies"
  ]
}

Ensure all learning objectives:
- Use appropriate action verbs from Bloom's taxonomy
- Are specific, measurable, and achievable
- Progress logically from basic to advanced concepts
- Align with the target audience and difficulty level`;

const DETAILED_CONTENT_PROMPT = `You are an expert content developer creating detailed learning materials based on an approved outline.

Approved Outline:
{APPROVED_OUTLINE}

Source Content:
{SOURCE_CONTENT}

Create detailed content blocks for each section in the outline. Each content block should:

1. **Follow the pedagogical approach**: {PEDAGOGICAL_APPROACH}
2. **Accommodate learning styles**: {LEARNING_STYLES}
3. **Maintain appropriate difficulty**: {DIFFICULTY}
4. **Include engagement strategies**
5. **Provide clear, actionable content**

Generate detailed content blocks in the following JSON format:

{
  "contentBlocks": [
    {
      "id": "unique_id",
      "type": "text|video|audio|image|interactive|simulation|quiz|assignment",
      "title": "Content block title",
      "content": "Detailed content - can be text, HTML, markdown, or structured data",
      "metadata": {
        "duration": 10,
        "difficulty": "beginner|intermediate|advanced",
        "learningStyles": ["visual", "auditory"],
        "interactionLevel": "passive|active|interactive",
        "accessibility": {
          "altText": "Alternative text for images",
          "captions": true,
          "transcription": true
        }
      },
      "resources": {
        "files": ["resource1.pdf"],
        "links": ["https://example.com"],
        "references": ["Reference 1"]
      }
    }
  ]
}

Make the content:
- **Engaging and interactive** where appropriate
- **Accessible** to learners with different abilities
- **Practical** with real-world examples and applications
- **Progressive** building from simple to complex concepts
- **Aligned** with the learning objectives and assessment strategy`;

export function createContentGeneratorTool(config: GraphConfig) {
  return tool(
    async (input): Promise<GeneratedContent> => {
      const {
        sourceContent,
        targetAudience,
        subject,
        learningObjectives,
        preferredLearningStyles,
        difficulty,
        estimatedDuration,
        pedagogicalApproach,
        requireApproval,
      } = input;

      try {
        logger.info("Starting content generation", {
          subject,
          targetAudience,
          difficulty,
          duration: estimatedDuration,
          pedagogicalApproach,
          requireApproval,
        });

        const model = await loadModel(config, LLMTask.SUMMARIZER);

        // Step 1: Generate content outline
        const outlinePrompt = CONTENT_OUTLINE_PROMPT
          .replace("{SOURCE_CONTENT}", sourceContent)
          .replace("{TARGET_AUDIENCE}", targetAudience)
          .replace("{SUBJECT}", subject)
          .replace("{LEARNING_OBJECTIVES}", learningObjectives.join(", "))
          .replace("{LEARNING_STYLES}", preferredLearningStyles.join(", "))
          .replace("{DIFFICULTY}", difficulty)
          .replace("{DURATION}", estimatedDuration.toString())
          .replace("{PEDAGOGICAL_APPROACH}", pedagogicalApproach);

        const outlineResponse = await model
          .withConfig({ tags: ["nostream"], runName: "content-outline-generation" })
          .invoke([
            {
              role: "user",
              content: outlinePrompt,
            },
          ]);

        const outlineResult = getMessageContentString(outlineResponse.content);

        // Parse the outline JSON
        let outline: ContentOutline;
        try {
          const jsonMatch = outlineResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in outline response");
          }
          outline = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          logger.error("Failed to parse outline result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResult: outlineResult,
          });
          
          // Create fallback outline
          outline = {
            title: `${subject} Learning Module`,
            overview: `Comprehensive learning module covering ${subject} for ${targetAudience}`,
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
            contentStructure: {
              sections: [
                {
                  title: "Introduction",
                  description: `Introduction to ${subject}`,
                  contentType: "text" as ContentType,
                  estimatedDuration: Math.round(estimatedDuration * 0.2),
                  bloomLevel: "understand" as BloomLevel,
                  learningStyles: preferredLearningStyles,
                },
                {
                  title: "Core Concepts",
                  description: `Core concepts and principles of ${subject}`,
                  contentType: "interactive" as ContentType,
                  estimatedDuration: Math.round(estimatedDuration * 0.6),
                  bloomLevel: "apply" as BloomLevel,
                  learningStyles: preferredLearningStyles,
                },
                {
                  title: "Practice and Assessment",
                  description: "Practice activities and assessment",
                  contentType: "quiz" as ContentType,
                  estimatedDuration: Math.round(estimatedDuration * 0.2),
                  bloomLevel: "evaluate" as BloomLevel,
                  learningStyles: preferredLearningStyles,
                },
              ],
            },
            assessmentStrategy: {
              formativeAssessments: ["Knowledge check questions", "Practice exercises"],
              summativeAssessment: "Comprehensive assessment covering all learning objectives",
              assessmentCriteria: ["Accuracy", "Understanding", "Application"],
            },
            instructionalDesignNotes: [
              "Content designed for multiple learning styles",
              "Progressive difficulty from basic to advanced",
              "Includes practical examples and applications",
            ],
          };
        }

        // If approval is required, return outline for approval
        if (requireApproval) {
          logger.info("Content outline generated, awaiting approval", {
            sectionsCount: outline.contentStructure.sections.length,
            objectivesCount: outline.learningObjectives.length,
          });

          return {
            outline,
            contentBlocks: [],
            status: "outline_pending_approval",
            approvalRequired: true,
          };
        }

        // Step 2: Generate detailed content (if no approval required)
        const detailedContentPrompt = DETAILED_CONTENT_PROMPT
          .replace("{APPROVED_OUTLINE}", JSON.stringify(outline, null, 2))
          .replace("{SOURCE_CONTENT}", sourceContent)
          .replace("{PEDAGOGICAL_APPROACH}", pedagogicalApproach)
          .replace("{LEARNING_STYLES}", preferredLearningStyles.join(", "))
          .replace("{DIFFICULTY}", difficulty);

        const contentResponse = await model
          .withConfig({ tags: ["nostream"], runName: "detailed-content-generation" })
          .invoke([
            {
              role: "user",
              content: detailedContentPrompt,
            },
          ]);

        const contentResult = getMessageContentString(contentResponse.content);

        // Parse the detailed content JSON
        let contentBlocks: ContentBlock[] = [];
        try {
          const jsonMatch = contentResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in content response");
          }
          const parsedContent = JSON.parse(jsonMatch[0]);
          contentBlocks = parsedContent.contentBlocks || [];
        } catch (parseError) {
          logger.error("Failed to parse content result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
          
          // Create fallback content blocks
          contentBlocks = outline.contentStructure.sections.map((section, index) => ({
            id: `block_${index + 1}`,
            type: section.contentType,
            title: section.title,
            content: `Content for ${section.title}: ${section.description}`,
            metadata: {
              duration: section.estimatedDuration,
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
          }));
        }

        logger.info("Content generation completed successfully", {
          outlineGenerated: true,
          contentBlocksCount: contentBlocks.length,
          approvalRequired: false,
        });

        return {
          outline,
          contentBlocks,
          status: "content_generated",
          approvalRequired: false,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error("Content generation failed", {
          error: errorMessage,
          subject,
          targetAudience,
        });

        return {
          outline: {
            title: "",
            overview: "",
            learningObjectives: [],
            contentStructure: { sections: [] },
            assessmentStrategy: {
              formativeAssessments: [],
              summativeAssessment: "",
              assessmentCriteria: [],
            },
            instructionalDesignNotes: [],
          },
          contentBlocks: [],
          status: "error",
          approvalRequired: false,
          error: errorMessage,
        };
      }
    },
    {
      name: "content_generator",
      description: "Generates structured learning content with instructional design principles and optional human approval checkpoints",
      schema: contentGeneratorSchema,
    }
  );
}

export function createContentGeneratorToolFields() {
  return {
    name: "content_generator",
    description: "Generates structured learning content with instructional design principles and optional human approval checkpoints",
    schema: contentGeneratorSchema,
  };
}
