import { createContentGeneratorTool } from "../elearning/content-generator.js";
import { createLessonBuilderTool } from "../elearning/lesson-builder.js";
import { createAssessmentCreatorTool } from "../elearning/assessment-creator.js";

// Mock config for testing
const mockConfig = {
  configurable: {
    model: "anthropic:claude-3-sonnet-20240229",
  },
} as any;

describe("E-Learning Tools", () => {
  describe("ContentGenerator", () => {
    it("should create content generator tool with correct schema", () => {
      const tool = createContentGeneratorTool(mockConfig);
      
      expect(tool.name).toBe("content_generator");
      expect(tool.description).toContain("Generates structured learning content");
    });
  });

  describe("LessonBuilder", () => {
    it("should create lesson builder tool with correct schema", () => {
      const tool = createLessonBuilderTool(mockConfig);
      
      expect(tool.name).toBe("lesson_builder");
      expect(tool.description).toContain("Builds comprehensive lessons");
    });
  });

  describe("AssessmentCreator", () => {
    it("should create assessment creator tool with correct schema", () => {
      const tool = createAssessmentCreatorTool(mockConfig);
      
      expect(tool.name).toBe("assessment_creator");
      expect(tool.description).toContain("Creates comprehensive assessments");
    });
  });

  describe("Human Approval Workflows", () => {
    it("should support approval checkpoints in content generation", () => {
      const tool = createContentGeneratorTool(mockConfig);
      
      // Verify the tool schema includes requireApproval parameter
      const schema = tool.schema as any;
      expect(schema.shape.requireApproval).toBeDefined();
      expect(schema.shape.requireApproval._def.defaultValue()).toBe(true);
    });

    it("should support approval checkpoints in lesson building", () => {
      const tool = createLessonBuilderTool(mockConfig);
      
      // Verify the tool schema includes requireApproval parameter
      const schema = tool.schema as any;
      expect(schema.shape.requireApproval).toBeDefined();
      expect(schema.shape.requireApproval._def.defaultValue()).toBe(true);
    });

    it("should support approval checkpoints in assessment creation", () => {
      const tool = createAssessmentCreatorTool(mockConfig);
      
      // Verify the tool schema includes requireApproval parameter
      const schema = tool.schema as any;
      expect(schema.shape.requireApproval).toBeDefined();
      expect(schema.shape.requireApproval._def.defaultValue()).toBe(true);
    });
  });

  describe("Instructional Design Integration", () => {
    it("should support multiple pedagogical approaches", () => {
      const contentTool = createContentGeneratorTool(mockConfig);
      const lessonTool = createLessonBuilderTool(mockConfig);
      
      const contentSchema = contentTool.schema as any;
      const lessonSchema = lessonTool.schema as any;
      
      // Verify pedagogical approaches are supported
      expect(contentSchema.shape.pedagogicalApproach).toBeDefined();
      expect(lessonSchema.shape.pedagogicalApproach).toBeDefined();
    });

    it("should support Bloom's taxonomy levels in assessments", () => {
      const tool = createAssessmentCreatorTool(mockConfig);
      
      const schema = tool.schema as any;
      expect(schema.shape.bloomLevels).toBeDefined();
      expect(schema.shape.bloomLevels._def.defaultValue()).toEqual([
        "remember", "understand", "apply"
      ]);
    });

    it("should support multiple learning styles", () => {
      const contentTool = createContentGeneratorTool(mockConfig);
      const lessonTool = createLessonBuilderTool(mockConfig);
      
      const contentSchema = contentTool.schema as any;
      const lessonSchema = lessonTool.schema as any;
      
      expect(contentSchema.shape.preferredLearningStyles).toBeDefined();
      expect(lessonSchema.shape.preferredLearningStyles).toBeDefined();
    });
  });
});

