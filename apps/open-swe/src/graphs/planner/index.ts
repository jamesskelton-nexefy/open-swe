import { END, START, StateGraph } from "@langchain/langgraph";
import {
  PlannerGraphState,
  PlannerGraphStateObj,
} from "@open-swe/shared/open-swe/planner/types";
import { GraphConfiguration } from "@open-swe/shared/open-swe/types";
import {
  generateAction,
  generatePlan,
  interruptProposedPlan,
  prepareGraphState,
  notetaker,
  takeActions,
  determineNeedsContext,
  learningDesignApproval,
  contentAnalysisApproval,
  courseStructureApproval,
} from "./nodes/index.js";
import { isAIMessage } from "@langchain/core/messages";
import { initializeSandbox } from "../shared/initialize-sandbox.js";
import { diagnoseError } from "../shared/diagnose-error.js";

function takeActionOrGeneratePlan(
  state: PlannerGraphState,
): "take-plan-actions" | "generate-plan" {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "take-plan-actions";
  }

  // If the last message does not have tool calls, continue to generate plan without modifications.
  return "generate-plan";
}

function routeToApprovalOrPlan(
  state: PlannerGraphState,
): "content-analysis-approval" | "learning-design-approval" | "course-structure-approval" | "interrupt-proposed-plan" {
  const { messages, plan } = state;
  
  // Check if this is an e-learning related request that needs approval
  const requestText = messages.map(msg => msg.content.toString().toLowerCase()).join(' ');
  const planText = plan?.map(item => item.description || item.title || '').join(' ').toLowerCase() || '';
  const combinedText = requestText + ' ' + planText;

  // Priority order: Content Analysis -> Learning Design -> Course Structure
  
  // Check for content analysis needs (PDF processing, content extraction)
  if (/pdf|extract|analyze|content|document|text|parse|process/.test(combinedText)) {
    return "content-analysis-approval";
  }
  
  // Check for learning design needs (objectives, instructional strategies)
  if (/learning|objective|bloom|instructional|pedagogical|assessment|strategy/.test(combinedText)) {
    return "learning-design-approval";
  }
  
  // Check for course structure needs (modules, sequencing, organization)
  if (/course|module|lesson|structure|sequence|path|curriculum|organize/.test(combinedText)) {
    return "course-structure-approval";
  }
  
  // Default to standard plan interruption
  return "interrupt-proposed-plan";
}

const workflow = new StateGraph(PlannerGraphStateObj, GraphConfiguration)
  .addNode("prepare-graph-state", prepareGraphState, {
    ends: [END, "initialize-sandbox"],
  })
  .addNode("initialize-sandbox", initializeSandbox)
  .addNode("generate-plan-context-action", generateAction)
  .addNode("take-plan-actions", takeActions, {
    ends: ["generate-plan-context-action", "diagnose-error", "generate-plan"],
  })
  .addNode("generate-plan", generatePlan)
  .addNode("notetaker", notetaker)
  .addNode("interrupt-proposed-plan", interruptProposedPlan, {
    ends: [END, "determine-needs-context"],
  })
  .addNode("content-analysis-approval", contentAnalysisApproval, {
    ends: [END, "learning-design-approval", "interrupt-proposed-plan"],
  })
  .addNode("learning-design-approval", learningDesignApproval, {
    ends: [END, "course-structure-approval", "interrupt-proposed-plan"],
  })
  .addNode("course-structure-approval", courseStructureApproval, {
    ends: [END, "interrupt-proposed-plan"],
  })
  .addNode("determine-needs-context", determineNeedsContext, {
    ends: ["generate-plan-context-action", "generate-plan"],
  })
  .addNode("diagnose-error", diagnoseError)
  .addEdge(START, "prepare-graph-state")
  .addEdge("initialize-sandbox", "generate-plan-context-action")
  .addConditionalEdges(
    "generate-plan-context-action",
    takeActionOrGeneratePlan,
    ["take-plan-actions", "generate-plan"],
  )
  .addEdge("diagnose-error", "generate-plan-context-action")
  .addEdge("generate-plan", "notetaker")
  .addConditionalEdges(
    "notetaker",
    routeToApprovalOrPlan,
    ["content-analysis-approval", "learning-design-approval", "course-structure-approval", "interrupt-proposed-plan"],
  )
  .addEdge("content-analysis-approval", "learning-design-approval")
  .addEdge("learning-design-approval", "course-structure-approval")
  .addEdge("course-structure-approval", "interrupt-proposed-plan");

export const graph = workflow.compile();
graph.name = "Open SWE - Planner";



