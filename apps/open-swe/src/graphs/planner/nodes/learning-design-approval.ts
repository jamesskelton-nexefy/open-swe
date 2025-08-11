import { RunnableConfig } from "@langchain/core/runnables";
import { PlannerGraphState } from "@open-swe/shared/open-swe/planner/types";
import { createLogger, LogLevel } from "../../../utils/logger.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const logger = createLogger(LogLevel.INFO, "LearningDesignApproval");

/**
 * Learning Design Approval Node
 * 
 * This node handles human approval for learning design decisions including:
 * - Learning objectives alignment with Bloom's taxonomy
 * - Instructional strategy selection
 * - Content sequencing and structure
 * - Assessment strategy validation
 * - Pedagogical approach confirmation
 */
export async function learningDesignApproval(
  state: PlannerGraphState,
  config?: RunnableConfig,
): Promise<Partial<PlannerGraphState>> {
  logger.info("Starting learning design approval process");

  const { messages, plan } = state;

  // Check if this is an e-learning related request
  const isELearningRequest = messages.some(msg => 
    msg.content.toString().toLowerCase().includes('learning') ||
    msg.content.toString().toLowerCase().includes('course') ||
    msg.content.toString().toLowerCase().includes('lesson') ||
    msg.content.toString().toLowerCase().includes('quiz') ||
    msg.content.toString().toLowerCase().includes('assessment') ||
    msg.content.toString().toLowerCase().includes('education') ||
    msg.content.toString().toLowerCase().includes('training')
  );

  if (!isELearningRequest) {
    logger.info("Non-e-learning request detected, skipping learning design approval");
    return {};
  }

  // Extract learning design elements from the plan
  const learningDesignElements = extractLearningDesignElements(plan);

  if (!learningDesignElements.hasLearningContent) {
    logger.info("No learning content detected in plan, skipping approval");
    return {};
  }

  // Create approval request message
  const approvalMessage = new HumanMessage({
    content: generateLearningDesignApprovalRequest(learningDesignElements),
  });

  // Create AI response indicating approval is needed
  const aiResponse = new AIMessage({
    content: `I've analyzed the learning design elements in this plan and identified key instructional design decisions that require your approval:

${formatLearningDesignSummary(learningDesignElements)}

Please review the learning design approach and confirm:
1. **Learning Objectives**: Are the learning objectives appropriately aligned with Bloom's taxonomy levels?
2. **Instructional Strategy**: Does the selected instructional approach match the target audience and content type?
3. **Content Sequencing**: Is the content structured in a logical, progressive manner?
4. **Assessment Strategy**: Are the assessment methods appropriate for measuring the stated learning objectives?
5. **Pedagogical Approach**: Does the overall pedagogical framework support effective learning?

**Options:**
- Type "approve" to proceed with the current learning design
- Type "modify" followed by your specific changes to adjust the approach
- Type "reject" to request a complete redesign of the learning strategy

Your approval ensures that the e-learning content will be pedagogically sound and effective for learners.`,
  });

  logger.info("Learning design approval request generated", {
    hasLearningObjectives: learningDesignElements.learningObjectives.length > 0,
    hasAssessments: learningDesignElements.assessments.length > 0,
    contentTypes: learningDesignElements.contentTypes,
  });

  return {
    messages: [...messages, approvalMessage, aiResponse],
    needsApproval: true,
    approvalType: "learning_design",
    approvalContext: learningDesignElements,
  };
}

interface LearningDesignElements {
  hasLearningContent: boolean;
  learningObjectives: string[];
  contentTypes: string[];
  assessments: string[];
  instructionalStrategies: string[];
  targetAudience: string[];
  bloomLevels: string[];
  pedagogicalApproaches: string[];
  contentSequencing: string[];
}

function extractLearningDesignElements(plan: any[]): LearningDesignElements {
  const planText = plan.map(item => item.description || item.title || '').join(' ').toLowerCase();

  return {
    hasLearningContent: /learning|course|lesson|quiz|assessment|education|training|curriculum/.test(planText),
    learningObjectives: extractMatches(planText, [
      'learning objective', 'learning goal', 'learning outcome', 'objective', 'goal', 'outcome'
    ]),
    contentTypes: extractMatches(planText, [
      'lesson', 'quiz', 'assessment', 'module', 'course', 'video', 'interactive', 'simulation'
    ]),
    assessments: extractMatches(planText, [
      'quiz', 'test', 'assessment', 'evaluation', 'exam', 'assignment', 'project'
    ]),
    instructionalStrategies: extractMatches(planText, [
      'constructivist', 'behaviorist', 'cognitivist', 'experiential', 'collaborative', 'inquiry-based'
    ]),
    targetAudience: extractMatches(planText, [
      'student', 'learner', 'professional', 'beginner', 'intermediate', 'advanced', 'employee'
    ]),
    bloomLevels: extractMatches(planText, [
      'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create', 'knowledge', 'comprehension'
    ]),
    pedagogicalApproaches: extractMatches(planText, [
      'addie', 'bloom', 'gagne', 'kirkpatrick', 'constructivism', 'behaviorism', 'cognitivism'
    ]),
    contentSequencing: extractMatches(planText, [
      'sequence', 'order', 'progression', 'prerequisite', 'dependency', 'scaffold', 'build upon'
    ]),
  };
}

function extractMatches(text: string, keywords: string[]): string[] {
  const matches: string[] = [];
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      matches.push(keyword);
    }
  });
  return [...new Set(matches)]; // Remove duplicates
}

function generateLearningDesignApprovalRequest(elements: LearningDesignElements): string {
  return `
## Learning Design Approval Required

I've identified that this plan involves e-learning content development and requires your approval for the instructional design approach.

### Detected Learning Elements:
- **Content Types**: ${elements.contentTypes.length > 0 ? elements.contentTypes.join(', ') : 'General learning content'}
- **Assessment Methods**: ${elements.assessments.length > 0 ? elements.assessments.join(', ') : 'To be determined'}
- **Target Audience**: ${elements.targetAudience.length > 0 ? elements.targetAudience.join(', ') : 'General learners'}
- **Bloom's Taxonomy Levels**: ${elements.bloomLevels.length > 0 ? elements.bloomLevels.join(', ') : 'Multiple levels'}
- **Pedagogical Approaches**: ${elements.pedagogicalApproaches.length > 0 ? elements.pedagogicalApproaches.join(', ') : 'Standard instructional design'}

### Key Design Decisions Requiring Approval:
1. **Learning Objective Alignment**: Ensuring objectives are SMART and properly mapped to Bloom's taxonomy
2. **Instructional Strategy Selection**: Choosing appropriate teaching methods for the content and audience
3. **Content Sequencing**: Organizing content from simple to complex, concrete to abstract
4. **Assessment Strategy**: Selecting appropriate formative and summative assessment methods
5. **Universal Design for Learning**: Ensuring accessibility and multiple means of representation

Please review and approve the learning design approach before proceeding with implementation.
`;
}

function formatLearningDesignSummary(elements: LearningDesignElements): string {
  const summary = [];

  if (elements.contentTypes.length > 0) {
    summary.push(`**Content Types**: ${elements.contentTypes.join(', ')}`);
  }

  if (elements.assessments.length > 0) {
    summary.push(`**Assessments**: ${elements.assessments.join(', ')}`);
  }

  if (elements.targetAudience.length > 0) {
    summary.push(`**Target Audience**: ${elements.targetAudience.join(', ')}`);
  }

  if (elements.bloomLevels.length > 0) {
    summary.push(`**Bloom's Levels**: ${elements.bloomLevels.join(', ')}`);
  }

  if (elements.pedagogicalApproaches.length > 0) {
    summary.push(`**Pedagogical Approaches**: ${elements.pedagogicalApproaches.join(', ')}`);
  }

  return summary.length > 0 ? summary.join('\n') : 'Standard e-learning content development approach';
}
