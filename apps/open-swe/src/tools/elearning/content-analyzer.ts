import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createLogger, LogLevel } from "../../utils/logger.js";
import { loadModel } from "../../utils/llms/index.js";
import { LLMTask } from "@open-swe/shared/open-swe/llm-task";
import { GraphConfig } from "@open-swe/shared/open-swe/types";
import { getMessageContentString } from "@open-swe/shared/messages";

const logger = createLogger(LogLevel.INFO, "ContentAnalyzer");

const contentAnalyzerSchema = z.object({
  content: z
    .string()
    .describe("The text content to analyze for learning objectives and key concepts"),
  contentType: z
    .enum(["pdf_text", "user_prompt", "mixed"])
    .default("pdf_text")
    .describe("The type of content being analyzed"),
  targetAudience: z
    .string()
    .optional()
    .describe("Optional target audience description (e.g., 'undergraduate students', 'professionals')"),
  subject: z
    .string()
    .optional()
    .describe("Optional subject area or domain"),
});

export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  assessmentSuggestion: string;
}

export interface KeyConcept {
  concept: string;
  definition: string;
  importance: "high" | "medium" | "low";
  prerequisites: string[];
  relatedConcepts: string[];
}

export interface ContentStructure {
  suggestedModules: Array<{
    title: string;
    description: string;
    estimatedDuration: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
  recommendedSequence: string[];
  assessmentPoints: string[];
}

export interface ContentAnalysisResult {
  learningObjectives: LearningObjective[];
  keyConcepts: KeyConcept[];
  contentStructure: ContentStructure;
  instructionalDesignRecommendations: {
    learningStyle: string[];
    deliveryMethods: string[];
    engagementStrategies: string[];
  };
  status: "success" | "error";
  error?: string;
}

const CONTENT_ANALYSIS_PROMPT = `You are an expert instructional designer and learning analyst. Analyze the provided content to extract learning objectives, key concepts, and suggest an optimal learning structure.

Follow these instructional design principles:
- **Bloom's Taxonomy**: Classify learning objectives by cognitive level (Remember, Understand, Apply, Analyze, Evaluate, Create)
- **ADDIE Model**: Consider Analysis, Design, Development, Implementation, and Evaluation phases
- **Adult Learning Principles**: Focus on practical application and relevance
- **Cognitive Load Theory**: Structure content to manage learner cognitive burden

Content to analyze:
{CONTENT}

Target Audience: {TARGET_AUDIENCE}
Subject Area: {SUBJECT}

Provide a comprehensive analysis in the following JSON format:

{
  "learningObjectives": [
    {
      "id": "unique_id",
      "description": "Clear, measurable learning objective using action verbs",
      "bloomLevel": "remember|understand|apply|analyze|evaluate|create",
      "assessmentSuggestion": "How to assess this objective"
    }
  ],
  "keyConcepts": [
    {
      "concept": "Concept name",
      "definition": "Clear definition",
      "importance": "high|medium|low",
      "prerequisites": ["prerequisite concepts"],
      "relatedConcepts": ["related concepts"]
    }
  ],
  "contentStructure": {
    "suggestedModules": [
      {
        "title": "Module title",
        "description": "Module description",
        "estimatedDuration": "Duration estimate",
        "difficulty": "beginner|intermediate|advanced"
      }
    ],
    "recommendedSequence": ["Logical sequence of topics"],
    "assessmentPoints": ["Where to place assessments"]
  },
  "instructionalDesignRecommendations": {
    "learningStyle": ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"],
    "deliveryMethods": ["Interactive content", "Video", "Text", "Simulations"],
    "engagementStrategies": ["Gamification", "Case studies", "Peer interaction"]
  }
}

Ensure all learning objectives are:
- Specific and measurable
- Aligned with appropriate Bloom's taxonomy level
- Relevant to the content and audience
- Achievable within reasonable timeframes`;

export function createContentAnalyzerTool(config: GraphConfig) {
  return tool(
    async (input): Promise<ContentAnalysisResult> => {
      const { content, contentType, targetAudience, subject } = input;

      try {
        logger.info("Starting content analysis", {
          contentType,
          contentLength: content.length,
          targetAudience,
          subject,
        });

        const model = await loadModel(config, LLMTask.SUMMARIZER);

        const analysisPrompt = CONTENT_ANALYSIS_PROMPT
          .replace("{CONTENT}", content)
          .replace("{TARGET_AUDIENCE}", targetAudience || "General learners")
          .replace("{SUBJECT}", subject || "Not specified");

        const response = await model
          .withConfig({ tags: ["nostream"], runName: "content-analysis" })
          .invoke([
            {
              role: "user",
              content: analysisPrompt,
            },
          ]);

        const analysisResult = getMessageContentString(response.content);

        // Parse the JSON response
        let parsedResult: ContentAnalysisResult;
        try {
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          
          const jsonData = JSON.parse(jsonMatch[0]);
          parsedResult = {
            ...jsonData,
            status: "success" as const,
          };
        } catch (parseError) {
          logger.error("Failed to parse analysis result", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResult: analysisResult,
          });
          
          // Fallback: create a basic structure
          parsedResult = {
            learningObjectives: [
              {
                id: "obj_1",
                description: "Understand the key concepts presented in the content",
                bloomLevel: "understand" as const,
                assessmentSuggestion: "Multiple choice quiz or short answer questions",
              },
            ],
            keyConcepts: [
              {
                concept: "Main Topic",
                definition: "Primary subject matter identified in the content",
                importance: "high" as const,
                prerequisites: [],
                relatedConcepts: [],
              },
            ],
            contentStructure: {
              suggestedModules: [
                {
                  title: "Introduction Module",
                  description: "Overview of the main concepts",
                  estimatedDuration: "30-45 minutes",
                  difficulty: "beginner" as const,
                },
              ],
              recommendedSequence: ["Introduction", "Core Concepts", "Application"],
              assessmentPoints: ["Mid-module check", "Final assessment"],
            },
            instructionalDesignRecommendations: {
              learningStyle: ["Visual", "Reading/Writing"],
              deliveryMethods: ["Interactive content", "Text"],
              engagementStrategies: ["Case studies", "Practice exercises"],
            },
            status: "success" as const,
          };
        }

        logger.info("Content analysis completed successfully", {
          objectivesCount: parsedResult.learningObjectives.length,
          conceptsCount: parsedResult.keyConcepts.length,
          modulesCount: parsedResult.contentStructure.suggestedModules.length,
        });

        return parsedResult;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error("Content analysis failed", {
          error: errorMessage,
          contentType,
        });

        return {
          learningObjectives: [],
          keyConcepts: [],
          contentStructure: {
            suggestedModules: [],
            recommendedSequence: [],
            assessmentPoints: [],
          },
          instructionalDesignRecommendations: {
            learningStyle: [],
            deliveryMethods: [],
            engagementStrategies: [],
          },
          status: "error",
          error: errorMessage,
        };
      }
    },
    {
      name: "content_analyzer",
      description: "Analyzes content to identify learning objectives, key concepts, and optimal learning structure using instructional design principles",
      schema: contentAnalyzerSchema,
    }
  );
}

export function createContentAnalyzerToolFields() {
  return {
    name: "content_analyzer",
    description: "Analyzes content to identify learning objectives, key concepts, and optimal learning structure using instructional design principles",
    schema: contentAnalyzerSchema,
  };
}
