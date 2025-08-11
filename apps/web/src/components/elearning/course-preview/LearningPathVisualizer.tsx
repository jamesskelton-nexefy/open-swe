"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle,
  Circle,
  Clock,
  Target,
  BookOpen,
  HelpCircle,
  FileText,
  ArrowRight,
  ArrowDown,
  MapPin,
  Route,
  Compass,
  TrendingUp,
  Award,
  Star,
  Zap,
  Brain,
  Eye,
  PlayCircle,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Users,
  Lightbulb,
  Flag
} from "lucide-react";

// Import types from course builder and player
import type { Course, CourseModule } from "../course-builder/CourseEditor";
import type { CourseProgress, LearningAnalytics } from "./ProgressTracker";

export interface LearningPathVisualizerProps {
  course: Course;
  progress: CourseProgress;
  onModuleClick?: (moduleIndex: number) => void;
  onPathChange?: (pathType: LearningPathType) => void;
  showRecommendations?: boolean;
  interactive?: boolean;
}

export type LearningPathType = "linear" | "adaptive" | "competency" | "personalized";

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  type: LearningPathType;
  modules: PathModule[];
  estimatedDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
  learningOutcomes: string[];
  adaptiveRules?: AdaptiveRule[];
}

export interface PathModule {
  moduleId: string;
  order: number;
  isRequired: boolean;
  prerequisites: string[];
  unlockConditions: UnlockCondition[];
  recommendedTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  learningObjectives: string[];
  connections: ModuleConnection[];
}

export interface UnlockCondition {
  type: "completion" | "score" | "time" | "assessment";
  moduleId?: string;
  threshold?: number;
  description: string;
}

export interface ModuleConnection {
  targetModuleId: string;
  type: "prerequisite" | "recommended" | "alternative" | "reinforcement";
  strength: number; // 0-1
  description: string;
}

export interface AdaptiveRule {
  condition: string;
  action: "skip" | "recommend" | "require" | "suggest_review";
  targetModuleId: string;
  description: string;
}

export interface LearningRecommendation {
  type: "next_module" | "review" | "practice" | "assessment" | "break";
  moduleId?: string;
  title: string;
  description: string;
  reason: string;
  priority: "low" | "medium" | "high";
  estimatedTime?: number;
}

const PATH_TYPES = [
  {
    type: "linear" as LearningPathType,
    name: "Linear Path",
    description: "Follow modules in sequential order",
    icon: ArrowRight,
    color: "bg-blue-100 text-blue-800",
  },
  {
    type: "adaptive" as LearningPathType,
    name: "Adaptive Path",
    description: "Path adjusts based on your performance",
    icon: Brain,
    color: "bg-purple-100 text-purple-800",
  },
  {
    type: "competency" as LearningPathType,
    name: "Competency-Based",
    description: "Focus on mastering specific skills",
    icon: Target,
    color: "bg-green-100 text-green-800",
  },
  {
    type: "personalized" as LearningPathType,
    name: "Personalized",
    description: "Customized based on your learning style",
    icon: Star,
    color: "bg-yellow-100 text-yellow-800",
  },
];

export function LearningPathVisualizer({ 
  course, 
  progress, 
  onModuleClick,
  onPathChange,
  showRecommendations = true,
  interactive = true
}: LearningPathVisualizerProps) {
  const [selectedPathType, setSelectedPathType] = useState<LearningPathType>("linear");
  const [viewMode, setViewMode] = useState<"flowchart" | "timeline" | "network">("flowchart");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showConnections, setShowConnections] = useState(true);

  // Generate learning path based on course and progress
  const learningPath = useMemo((): LearningPath => {
    const pathModules: PathModule[] = course.modules.map((module, index) => ({
      moduleId: module.id,
      order: index,
      isRequired: true,
      prerequisites: index > 0 ? [course.modules[index - 1].id] : [],
      unlockConditions: index > 0 ? [{
        type: "completion",
        moduleId: course.modules[index - 1].id,
        description: `Complete ${course.modules[index - 1].title}`,
      }] : [],
      recommendedTime: module.duration,
      difficulty: module.difficulty,
      learningObjectives: module.learningObjectives,
      connections: generateModuleConnections(module, course.modules, index),
    }));

    return {
      id: `${course.id}_${selectedPathType}`,
      name: `${course.title} - ${PATH_TYPES.find(p => p.type === selectedPathType)?.name}`,
      description: `${selectedPathType} learning path for ${course.title}`,
      type: selectedPathType,
      modules: pathModules,
      estimatedDuration: course.estimatedDuration,
      difficulty: course.difficulty,
      prerequisites: course.prerequisites,
      learningOutcomes: course.learningObjectives,
      adaptiveRules: selectedPathType === "adaptive" ? generateAdaptiveRules(course.modules) : undefined,
    };
  }, [course, selectedPathType]);

  // Generate recommendations
  const recommendations = useMemo((): LearningRecommendation[] => {
    if (!showRecommendations) return [];

    const recs: LearningRecommendation[] = [];
    const currentModule = course.modules[progress.currentModuleIndex];
    const completedCount = progress.completedModules.length;

    // Next module recommendation
    if (progress.currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[progress.currentModuleIndex + 1];
      recs.push({
        type: "next_module",
        moduleId: nextModule.id,
        title: `Continue to ${nextModule.title}`,
        description: `Ready for the next module in your learning path`,
        reason: "Sequential progression",
        priority: "high",
        estimatedTime: nextModule.duration,
      });
    }

    // Review recommendation based on quiz scores
    const lowScoreModules = Object.entries(progress.quizScores)
      .filter(([_, score]) => score < 70)
      .map(([moduleId]) => course.modules.find(m => m.id === moduleId))
      .filter(Boolean);

    if (lowScoreModules.length > 0) {
      recs.push({
        type: "review",
        moduleId: lowScoreModules[0]!.id,
        title: `Review ${lowScoreModules[0]!.title}`,
        description: "Strengthen your understanding of key concepts",
        reason: `Quiz score below 70% (${progress.quizScores[lowScoreModules[0]!.id]}%)`,
        priority: "medium",
        estimatedTime: Math.floor(lowScoreModules[0]!.duration * 0.5),
      });
    }

    // Break recommendation based on time spent
    if (progress.timeSpent > 3600) { // More than 1 hour
      recs.push({
        type: "break",
        title: "Take a Break",
        description: "You've been learning for a while. A short break can help consolidate knowledge.",
        reason: `${Math.floor(progress.timeSpent / 60)} minutes of continuous learning`,
        priority: "low",
        estimatedTime: 15,
      });
    }

    return recs;
  }, [course.modules, progress, showRecommendations]);

  // Handle path type change
  const handlePathTypeChange = useCallback((pathType: LearningPathType) => {
    setSelectedPathType(pathType);
    onPathChange?.(pathType);
  }, [onPathChange]);

  // Toggle module expansion
  const toggleModuleExpansion = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  }, []);

  // Check if module is unlocked
  const isModuleUnlocked = useCallback((pathModule: PathModule) => {
    if (pathModule.order === 0) return true;
    
    return pathModule.unlockConditions.every(condition => {
      switch (condition.type) {
        case "completion":
          return condition.moduleId ? progress.completedModules.includes(condition.moduleId) : false;
        case "score":
          return condition.moduleId && condition.threshold 
            ? (progress.quizScores[condition.moduleId] || 0) >= condition.threshold
            : false;
        default:
          return true;
      }
    });
  }, [progress.completedModules, progress.quizScores]);

  return (
    <div className="space-y-6">
      {/* Path Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PATH_TYPES.map((pathType) => (
              <Card
                key={pathType.type}
                className={`cursor-pointer transition-colors ${
                  selectedPathType === pathType.type
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handlePathTypeChange(pathType.type)}
              >
                <CardContent className="p-4 text-center">
                  <pathType.icon className="h-8 w-8 mx-auto mb-2" />
                  <h4 className="font-medium mb-1">{pathType.name}</h4>
                  <p className="text-xs text-muted-foreground">{pathType.description}</p>
                  {selectedPathType === pathType.type && (
                    <Badge className="mt-2" variant="default">Active</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="flowchart">Flowchart</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConnections(!showConnections)}
          >
            {showConnections ? "Hide" : "Show"} Connections
          </Button>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Path Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Course Structure</span>
                <Badge variant="outline">
                  {progress.completedModules.length}/{course.modules.length} Complete
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === "flowchart" && (
                <FlowchartView
                  learningPath={learningPath}
                  progress={progress}
                  onModuleClick={onModuleClick}
                  isModuleUnlocked={isModuleUnlocked}
                  expandedModules={expandedModules}
                  onToggleExpansion={toggleModuleExpansion}
                  showConnections={showConnections}
                />
              )}
              {viewMode === "timeline" && (
                <TimelineView
                  learningPath={learningPath}
                  progress={progress}
                  onModuleClick={onModuleClick}
                  isModuleUnlocked={isModuleUnlocked}
                />
              )}
              {viewMode === "network" && (
                <NetworkView
                  learningPath={learningPath}
                  progress={progress}
                  onModuleClick={onModuleClick}
                  isModuleUnlocked={isModuleUnlocked}
                  showConnections={showConnections}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Path Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Path Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{PATH_TYPES.find(p => p.type === selectedPathType)?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <p className="font-medium">{learningPath.estimatedDuration} minutes</p>
              </div>
              <div>
                <span className="text-muted-foreground">Difficulty:</span>
                <Badge variant="outline" className="text-xs">
                  {learningPath.difficulty}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Progress:</span>
                <div className="mt-1">
                  <Progress value={(progress.completedModules.length / course.modules.length) * 100} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {progress.completedModules.length} of {course.modules.length} modules
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{rec.title}</h4>
                      <Badge 
                        variant={rec.priority === "high" ? "default" : rec.priority === "medium" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    {rec.estimatedTime && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {rec.estimatedTime} min
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Learning Outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Target className="h-4 w-4 mr-2" />
                Learning Outcomes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {learningPath.learningOutcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Flowchart View Component
function FlowchartView({ 
  learningPath, 
  progress, 
  onModuleClick, 
  isModuleUnlocked,
  expandedModules,
  onToggleExpansion,
  showConnections
}: {
  learningPath: LearningPath;
  progress: CourseProgress;
  onModuleClick?: (moduleIndex: number) => void;
  isModuleUnlocked: (pathModule: PathModule) => boolean;
  expandedModules: Set<string>;
  onToggleExpansion: (moduleId: string) => void;
  showConnections: boolean;
}) {
  return (
    <div className="space-y-4">
      {learningPath.modules.map((pathModule, index) => {
        const module = learningPath.modules.find(m => m.moduleId === pathModule.moduleId);
        if (!module) return null;

        const isCompleted = progress.completedModules.includes(pathModule.moduleId);
        const isCurrent = index === progress.currentModuleIndex;
        const isUnlocked = isModuleUnlocked(pathModule);
        const isExpanded = expandedModules.has(pathModule.moduleId);

        return (
          <div key={pathModule.moduleId} className="relative">
            <Card
              className={`cursor-pointer transition-colors ${
                isCurrent ? "border-primary bg-primary/5" : 
                isCompleted ? "border-green-200 bg-green-50" :
                !isUnlocked ? "border-muted bg-muted/30" : "hover:bg-muted/50"
              }`}
              onClick={() => onModuleClick?.(index)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-6 w-6 text-primary" />
                      ) : isUnlocked ? (
                        <Unlock className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">Module {index + 1}: {pathModule.moduleId}</h4>
                        <Badge variant={pathModule.isRequired ? "default" : "secondary"} className="text-xs">
                          {pathModule.isRequired ? "Required" : "Optional"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pathModule.difficulty}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {pathModule.recommendedTime}min
                        </div>
                        <div className="flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          {pathModule.learningObjectives.length} objectives
                        </div>
                      </div>

                      {/* Prerequisites */}
                      {pathModule.prerequisites.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">
                            Prerequisites: {pathModule.prerequisites.length} modules
                          </p>
                        </div>
                      )}

                      {/* Progress */}
                      {progress.moduleProgress[pathModule.moduleId] !== undefined && (
                        <div className="mt-2">
                          <Progress 
                            value={progress.moduleProgress[pathModule.moduleId]} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpansion(pathModule.moduleId);
                    }}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-2">Learning Objectives</h5>
                      <ul className="space-y-1 text-sm">
                        {pathModule.learningObjectives.map((objective, objIndex) => (
                          <li key={objIndex} className="flex items-start space-x-2">
                            <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                            <span>{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {pathModule.unlockConditions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Unlock Conditions</h5>
                        <ul className="space-y-1 text-sm">
                          {pathModule.unlockConditions.map((condition, condIndex) => (
                            <li key={condIndex} className="flex items-start space-x-2">
                              <Circle className="h-3 w-3 mt-1 flex-shrink-0" />
                              <span>{condition.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {showConnections && pathModule.connections.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Connections</h5>
                        <div className="flex flex-wrap gap-1">
                          {pathModule.connections.map((connection, connIndex) => (
                            <Badge key={connIndex} variant="outline" className="text-xs">
                              {connection.type}: Module {connection.targetModuleId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Arrow */}
            {index < learningPath.modules.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Timeline View Component
function TimelineView({ 
  learningPath, 
  progress, 
  onModuleClick, 
  isModuleUnlocked 
}: {
  learningPath: LearningPath;
  progress: CourseProgress;
  onModuleClick?: (moduleIndex: number) => void;
  isModuleUnlocked: (pathModule: PathModule) => boolean;
}) {
  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
      
      <div className="space-y-6">
        {learningPath.modules.map((pathModule, index) => {
          const isCompleted = progress.completedModules.includes(pathModule.moduleId);
          const isCurrent = index === progress.currentModuleIndex;
          const isUnlocked = isModuleUnlocked(pathModule);

          return (
            <div key={pathModule.moduleId} className="relative flex items-start space-x-4">
              {/* Timeline Node */}
              <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                isCompleted ? "bg-green-500 border-green-500" :
                isCurrent ? "bg-primary border-primary" :
                isUnlocked ? "bg-background border-border" : "bg-muted border-muted"
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : isCurrent ? (
                  <PlayCircle className="h-6 w-6 text-white" />
                ) : isUnlocked ? (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Module Card */}
              <Card 
                className={`flex-1 cursor-pointer transition-colors ${
                  isCurrent ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => onModuleClick?.(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium mb-1">
                        Module {index + 1}: {pathModule.moduleId}
                      </h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {pathModule.difficulty}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {pathModule.recommendedTime}min
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {pathModule.learningObjectives.length} learning objectives
                      </p>
                    </div>
                    
                    {progress.moduleProgress[pathModule.moduleId] !== undefined && (
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {Math.round(progress.moduleProgress[pathModule.moduleId])}%
                        </div>
                        <Progress 
                          value={progress.moduleProgress[pathModule.moduleId]} 
                          className="w-16 h-2 mt-1"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Network View Component
function NetworkView({ 
  learningPath, 
  progress, 
  onModuleClick, 
  isModuleUnlocked,
  showConnections
}: {
  learningPath: LearningPath;
  progress: CourseProgress;
  onModuleClick?: (moduleIndex: number) => void;
  isModuleUnlocked: (pathModule: PathModule) => boolean;
  showConnections: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {learningPath.modules.map((pathModule, index) => {
        const isCompleted = progress.completedModules.includes(pathModule.moduleId);
        const isCurrent = index === progress.currentModuleIndex;
        const isUnlocked = isModuleUnlocked(pathModule);

        return (
          <Card
            key={pathModule.moduleId}
            className={`cursor-pointer transition-colors relative ${
              isCurrent ? "border-primary bg-primary/5" : 
              isCompleted ? "border-green-200 bg-green-50" :
              !isUnlocked ? "border-muted bg-muted/30" : "hover:bg-muted/50"
            }`}
            onClick={() => onModuleClick?.(index)}
          >
            <CardContent className="p-3 text-center">
              <div className="mb-2">
                {isCompleted ? (
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                ) : isCurrent ? (
                  <PlayCircle className="h-8 w-8 mx-auto text-primary" />
                ) : isUnlocked ? (
                  <Circle className="h-8 w-8 mx-auto text-muted-foreground" />
                ) : (
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
                )}
              </div>
              
              <h4 className="font-medium text-sm mb-1">
                Module {index + 1}
              </h4>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center justify-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {pathModule.recommendedTime}min
                </div>
                <Badge variant="outline" className="text-xs">
                  {pathModule.difficulty}
                </Badge>
              </div>

              {progress.moduleProgress[pathModule.moduleId] !== undefined && (
                <div className="mt-2">
                  <Progress 
                    value={progress.moduleProgress[pathModule.moduleId]} 
                    className="h-1"
                  />
                </div>
              )}

              {/* Connection indicators */}
              {showConnections && pathModule.connections.length > 0 && (
                <div className="absolute -top-1 -right-1">
                  <Badge variant="secondary" className="text-xs w-5 h-5 p-0 flex items-center justify-center">
                    {pathModule.connections.length}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Helper functions
function generateModuleConnections(
  module: CourseModule, 
  allModules: CourseModule[], 
  currentIndex: number
): ModuleConnection[] {
  const connections: ModuleConnection[] = [];

  // Add prerequisite connections
  if (currentIndex > 0) {
    connections.push({
      targetModuleId: allModules[currentIndex - 1].id,
      type: "prerequisite",
      strength: 1.0,
      description: "Required prerequisite module",
    });
  }

  // Add recommended connections based on similar topics
  allModules.forEach((otherModule, index) => {
    if (index !== currentIndex && Math.abs(index - currentIndex) <= 2) {
      const sharedObjectives = module.learningObjectives.filter(obj =>
        otherModule.learningObjectives.some(otherObj => 
          otherObj.toLowerCase().includes(obj.toLowerCase().split(' ')[0])
        )
      );

      if (sharedObjectives.length > 0) {
        connections.push({
          targetModuleId: otherModule.id,
          type: "recommended",
          strength: sharedObjectives.length / module.learningObjectives.length,
          description: `Related content: ${sharedObjectives.length} shared concepts`,
        });
      }
    }
  });

  return connections;
}

function generateAdaptiveRules(modules: CourseModule[]): AdaptiveRule[] {
  const rules: AdaptiveRule[] = [];

  modules.forEach((module, index) => {
    // Skip rule for high performers
    if (index > 0) {
      rules.push({
        condition: `quiz_score > 95 AND completion_time < ${module.duration * 0.7}`,
        action: "skip",
        targetModuleId: modules[Math.min(index + 1, modules.length - 1)].id,
        description: "Skip next module for high performers",
      });
    }

    // Review rule for low performers
    rules.push({
      condition: `quiz_score < 60`,
      action: "suggest_review",
      targetModuleId: module.id,
      description: "Suggest review for low quiz scores",
    });

    // Recommend practice for intermediate performers
    if (index < modules.length - 1) {
      rules.push({
        condition: `quiz_score >= 60 AND quiz_score < 80`,
        action: "recommend",
        targetModuleId: modules[index + 1].id,
        description: "Recommend additional practice",
      });
    }
  });

  return rules;
}
