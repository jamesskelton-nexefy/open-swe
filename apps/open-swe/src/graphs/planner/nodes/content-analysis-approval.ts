import { RunnableConfig } from "@langchain/core/runnables";
import { PlannerGraphState } from "@open-swe/shared/open-swe/planner/types";
import { createLogger, LogLevel } from "../../../utils/logger.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const logger = createLogger(LogLevel.INFO, "ContentAnalysisApproval");

/**
 * Content Analysis Approval Node
 * 
 * This node handles human approval for content analysis decisions including:
 * - PDF content extraction and interpretation
 * - Learning objective identification from source materials
 * - Key concept extraction and categorization
 * - Content structure and organization validation
 * - Target audience and difficulty level assessment
 */
export async function contentAnalysisApproval(
  state: PlannerGraphState,
  config?: RunnableConfig,
): Promise<Partial<PlannerGraphState>> {
  logger.info("Starting content analysis approval process");

  const { messages, plan } = state;

  // Check if this involves content analysis (PDF processing, content extraction, etc.)
  const isContentAnalysisRequest = messages.some(msg => 
    msg.content.toString().toLowerCase().includes('pdf') ||
    msg.content.toString().toLowerCase().includes('extract') ||
    msg.content.toString().toLowerCase().includes('analyze') ||
    msg.content.toString().toLowerCase().includes('content') ||
    msg.content.toString().toLowerCase().includes('document') ||
    msg.content.toString().toLowerCase().includes('text')
  );

  if (!isContentAnalysisRequest) {
    logger.info("Non-content analysis request detected, skipping content analysis approval");
    return {};
  }

  // Extract content analysis elements from the plan
  const contentAnalysisElements = extractContentAnalysisElements(plan);

  if (!contentAnalysisElements.hasContentAnalysis) {
    logger.info("No content analysis detected in plan, skipping approval");
    return {};
  }

  // Create approval request message
  const approvalMessage = new HumanMessage({
    content: generateContentAnalysisApprovalRequest(contentAnalysisElements),
  });

  // Create AI response indicating approval is needed
  const aiResponse = new AIMessage({
    content: `I've analyzed the content analysis approach in this plan and identified key decisions that require your approval:

${formatContentAnalysisSummary(contentAnalysisElements)}

Please review the content analysis strategy and confirm:
1. **Source Material Processing**: Is the approach for extracting and processing source content appropriate?
2. **Learning Objective Extraction**: Are the methods for identifying learning objectives from content suitable?
3. **Content Categorization**: Is the strategy for organizing and categorizing content effective?
4. **Quality Assessment**: Are the criteria for evaluating content quality and relevance appropriate?
5. **Target Audience Analysis**: Is the approach for determining target audience and difficulty levels accurate?

**Options:**
- Type "approve" to proceed with the current content analysis approach
- Type "modify" followed by your specific changes to adjust the analysis strategy
- Type "reject" to request a complete redesign of the content analysis approach

Your approval ensures that the content analysis will accurately identify learning elements and support effective instructional design.`,
  });

  logger.info("Content analysis approval request generated", {
    hasSourceMaterials: contentAnalysisElements.sourceMaterials.length > 0,
    hasExtractionMethods: contentAnalysisElements.extractionMethods.length > 0,
    analysisTypes: contentAnalysisElements.analysisTypes,
  });

  return {
    messages: [...messages, approvalMessage, aiResponse],
    needsApproval: true,
    approvalType: "content_analysis",
    approvalContext: contentAnalysisElements,
  };
}

interface ContentAnalysisElements {
  hasContentAnalysis: boolean;
  sourceMaterials: string[];
  extractionMethods: string[];
  analysisTypes: string[];
  contentTypes: string[];
  qualityMetrics: string[];
  organizationStrategies: string[];
  targetAudienceFactors: string[];
  difficultyAssessment: string[];
}

function extractContentAnalysisElements(plan: any[]): ContentAnalysisElements {
  const planText = plan.map(item => item.description || item.title || '').join(' ').toLowerCase();

  return {
    hasContentAnalysis: /pdf|extract|analyze|content|document|text|parse|process/.test(planText),
    sourceMaterials: extractMatches(planText, [
      'pdf', 'document', 'text', 'file', 'material', 'source', 'content', 'manuscript'
    ]),
    extractionMethods: extractMatches(planText, [
      'extract', 'parse', 'process', 'analyze', 'identify', 'detect', 'recognize'
    ]),
    analysisTypes: extractMatches(planText, [
      'learning objective', 'key concept', 'topic', 'theme', 'subject', 'skill', 'knowledge'
    ]),
    contentTypes: extractMatches(planText, [
      'lesson', 'module', 'chapter', 'section', 'unit', 'course', 'curriculum'
    ]),
    qualityMetrics: extractMatches(planText, [
      'quality', 'relevance', 'accuracy', 'completeness', 'clarity', 'coherence'
    ]),
    organizationStrategies: extractMatches(planText, [
      'structure', 'organize', 'categorize', 'classify', 'group', 'sequence', 'order'
    ]),
    targetAudienceFactors: extractMatches(planText, [
      'audience', 'learner', 'student', 'user', 'beginner', 'intermediate', 'advanced'
    ]),
    difficultyAssessment: extractMatches(planText, [
      'difficulty', 'complexity', 'level', 'grade', 'skill level', 'proficiency'
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

function generateContentAnalysisApprovalRequest(elements: ContentAnalysisElements): string {
  return `
## Content Analysis Approval Required

I've identified that this plan involves content analysis and extraction, which requires your approval for the analysis approach and methodology.

### Detected Content Analysis Elements:
- **Source Materials**: ${elements.sourceMaterials.length > 0 ? elements.sourceMaterials.join(', ') : 'Various content sources'}
- **Extraction Methods**: ${elements.extractionMethods.length > 0 ? elements.extractionMethods.join(', ') : 'Standard extraction techniques'}
- **Analysis Types**: ${elements.analysisTypes.length > 0 ? elements.analysisTypes.join(', ') : 'General content analysis'}
- **Content Organization**: ${elements.organizationStrategies.length > 0 ? elements.organizationStrategies.join(', ') : 'Structured organization'}
- **Quality Assessment**: ${elements.qualityMetrics.length > 0 ? elements.qualityMetrics.join(', ') : 'Standard quality metrics'}

### Key Analysis Decisions Requiring Approval:
1. **Content Extraction Strategy**: Method for extracting meaningful content from source materials
2. **Learning Element Identification**: Approach for identifying learning objectives, key concepts, and skills
3. **Content Quality Assessment**: Criteria for evaluating content relevance, accuracy, and completeness
4. **Audience and Difficulty Analysis**: Method for determining appropriate target audience and difficulty levels
5. **Content Organization**: Strategy for structuring and categorizing extracted content

Please review and approve the content analysis methodology before proceeding with implementation.
`;
}

function formatContentAnalysisSummary(elements: ContentAnalysisElements): string {
  const summary = [];

  if (elements.sourceMaterials.length > 0) {
    summary.push(`**Source Materials**: ${elements.sourceMaterials.join(', ')}`);
  }

  if (elements.extractionMethods.length > 0) {
    summary.push(`**Extraction Methods**: ${elements.extractionMethods.join(', ')}`);
  }

  if (elements.analysisTypes.length > 0) {
    summary.push(`**Analysis Types**: ${elements.analysisTypes.join(', ')}`);
  }

  if (elements.organizationStrategies.length > 0) {
    summary.push(`**Organization Strategy**: ${elements.organizationStrategies.join(', ')}`);
  }

  if (elements.qualityMetrics.length > 0) {
    summary.push(`**Quality Metrics**: ${elements.qualityMetrics.join(', ')}`);
  }

  return summary.length > 0 ? summary.join('\n') : 'Standard content analysis approach';
}
