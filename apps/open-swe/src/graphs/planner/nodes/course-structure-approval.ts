import { RunnableConfig } from "@langchain/core/runnables";
import { PlannerGraphState } from "@open-swe/shared/open-swe/planner/types";
import { createLogger, LogLevel } from "../../../utils/logger.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const logger = createLogger(LogLevel.INFO, "CourseStructureApproval");

/**
 * Course Structure Approval Node
 * 
 * This node handles human approval for course structure decisions including:
 * - Module sequencing and dependencies
 * - Learning path design and progression
 * - Assessment placement and timing
 * - Content organization and flow
 * - Prerequisites and unlock conditions
 */
export async function courseStructureApproval(
  state: PlannerGraphState,
  config?: RunnableConfig,
): Promise<Partial<PlannerGraphState>> {
  logger.info("Starting course structure approval process");

  const { messages, plan } = state;

  // Check if this involves course structure design
  const isCourseStructureRequest = messages.some(msg => 
    msg.content.toString().toLowerCase().includes('course') ||
    msg.content.toString().toLowerCase().includes('module') ||
    msg.content.toString().toLowerCase().includes('lesson') ||
    msg.content.toString().toLowerCase().includes('structure') ||
    msg.content.toString().toLowerCase().includes('sequence') ||
    msg.content.toString().toLowerCase().includes('path') ||
    msg.content.toString().toLowerCase().includes('curriculum')
  );

  if (!isCourseStructureRequest) {
    logger.info("Non-course structure request detected, skipping course structure approval");
    return {};
  }

  // Extract course structure elements from the plan
  const courseStructureElements = extractCourseStructureElements(plan);

  if (!courseStructureElements.hasCourseStructure) {
    logger.info("No course structure detected in plan, skipping approval");
    return {};
  }

  // Create approval request message
  const approvalMessage = new HumanMessage({
    content: generateCourseStructureApprovalRequest(courseStructureElements),
  });

  // Create AI response indicating approval is needed
  const aiResponse = new AIMessage({
    content: `I've analyzed the course structure design in this plan and identified key architectural decisions that require your approval:

${formatCourseStructureSummary(courseStructureElements)}

Please review the course structure and confirm:
1. **Module Sequencing**: Is the order of modules logical and pedagogically sound?
2. **Learning Progression**: Does the structure support progressive skill building from basic to advanced concepts?
3. **Assessment Integration**: Are assessments appropriately placed to reinforce learning and measure progress?
4. **Prerequisites and Dependencies**: Are module dependencies clearly defined and educationally justified?
5. **Learning Path Design**: Does the overall structure support effective learning outcomes?

**Options:**
- Type "approve" to proceed with the current course structure
- Type "modify" followed by your specific changes to adjust the structure
- Type "reject" to request a complete redesign of the course architecture

Your approval ensures that the course structure will provide an effective and engaging learning experience.`,
  });

  logger.info("Course structure approval request generated", {
    hasModules: courseStructureElements.modules.length > 0,
    hasAssessments: courseStructureElements.assessments.length > 0,
    hasSequencing: courseStructureElements.sequencing.length > 0,
  });

  return {
    messages: [...messages, approvalMessage, aiResponse],
    needsApproval: true,
    approvalType: "course_structure",
    approvalContext: courseStructureElements,
  };
}

interface CourseStructureElements {
  hasCourseStructure: boolean;
  modules: string[];
  lessons: string[];
  assessments: string[];
  sequencing: string[];
  prerequisites: string[];
  learningPaths: string[];
  progressionTypes: string[];
  organizationPatterns: string[];
  navigationElements: string[];
}

function extractCourseStructureElements(plan: any[]): CourseStructureElements {
  const planText = plan.map(item => item.description || item.title || '').join(' ').toLowerCase();

  return {
    hasCourseStructure: /course|module|lesson|structure|sequence|path|curriculum|organize/.test(planText),
    modules: extractMatches(planText, [
      'module', 'unit', 'chapter', 'section', 'component', 'part'
    ]),
    lessons: extractMatches(planText, [
      'lesson', 'topic', 'subject', 'class', 'session', 'activity'
    ]),
    assessments: extractMatches(planText, [
      'quiz', 'test', 'assessment', 'evaluation', 'exam', 'assignment', 'project', 'checkpoint'
    ]),
    sequencing: extractMatches(planText, [
      'sequence', 'order', 'progression', 'flow', 'structure', 'organize', 'arrange'
    ]),
    prerequisites: extractMatches(planText, [
      'prerequisite', 'dependency', 'requirement', 'condition', 'unlock', 'access'
    ]),
    learningPaths: extractMatches(planText, [
      'path', 'route', 'journey', 'track', 'pathway', 'progression', 'flow'
    ]),
    progressionTypes: extractMatches(planText, [
      'linear', 'adaptive', 'branching', 'personalized', 'flexible', 'guided'
    ]),
    organizationPatterns: extractMatches(planText, [
      'hierarchical', 'sequential', 'modular', 'spiral', 'layered', 'networked'
    ]),
    navigationElements: extractMatches(planText, [
      'navigation', 'menu', 'sidebar', 'breadcrumb', 'progress', 'tracker'
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

function generateCourseStructureApprovalRequest(elements: CourseStructureElements): string {
  return `
## Course Structure Approval Required

I've identified that this plan involves course structure design and requires your approval for the architectural and pedagogical decisions.

### Detected Course Structure Elements:
- **Modules/Units**: ${elements.modules.length > 0 ? elements.modules.join(', ') : 'Modular structure'}
- **Lessons/Topics**: ${elements.lessons.length > 0 ? elements.lessons.join(', ') : 'Individual lessons'}
- **Assessments**: ${elements.assessments.length > 0 ? elements.assessments.join(', ') : 'Integrated assessments'}
- **Sequencing Strategy**: ${elements.sequencing.length > 0 ? elements.sequencing.join(', ') : 'Logical progression'}
- **Learning Paths**: ${elements.learningPaths.length > 0 ? elements.learningPaths.join(', ') : 'Structured pathways'}

### Key Structure Decisions Requiring Approval:
1. **Module Organization**: How content is divided into logical, manageable units
2. **Learning Sequence**: The order and flow of content from foundational to advanced
3. **Assessment Placement**: Strategic positioning of quizzes, tests, and evaluations
4. **Prerequisite Structure**: Dependencies between modules and unlock conditions
5. **Navigation Design**: How learners will move through the course content

Please review and approve the course structure design before proceeding with implementation.
`;
}

function formatCourseStructureSummary(elements: CourseStructureElements): string {
  const summary = [];

  if (elements.modules.length > 0) {
    summary.push(`**Modules**: ${elements.modules.join(', ')}`);
  }

  if (elements.assessments.length > 0) {
    summary.push(`**Assessments**: ${elements.assessments.join(', ')}`);
  }

  if (elements.sequencing.length > 0) {
    summary.push(`**Sequencing**: ${elements.sequencing.join(', ')}`);
  }

  if (elements.learningPaths.length > 0) {
    summary.push(`**Learning Paths**: ${elements.learningPaths.join(', ')}`);
  }

  if (elements.progressionTypes.length > 0) {
    summary.push(`**Progression Types**: ${elements.progressionTypes.join(', ')}`);
  }

  return summary.length > 0 ? summary.join('\n') : 'Standard course structure approach';
}
