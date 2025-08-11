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
  TrendingUp,
  Award,
  BookOpen,
  HelpCircle,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Trophy,
  Zap,
  Brain,
  Eye,
  PlayCircle
} from "lucide-react";

// Import types from course builder and player
import type { Course, CourseModule } from "../course-builder/CourseEditor";
import type { CourseProgress } from "./CoursePlayer";

export interface ProgressTrackerProps {
  course: Course;
  progress: CourseProgress;
  onModuleClick?: (moduleIndex: number) => void;
  compact?: boolean;
  showDetailed?: boolean;
}

export interface LearningAnalytics {
  totalTimeSpent: number;
  averageSessionTime: number;
  completionRate: number;
  quizAverageScore: number;
  strongestAreas: string[];
  improvementAreas: string[];
  learningVelocity: number; // modules per week
  engagementScore: number; // 0-100
  achievements: Achievement[];
  streakDays: number;
  lastActiveDate: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: "completion" | "performance" | "engagement" | "streak";
  points: number;
}

export interface ModuleAnalytics {
  moduleId: string;
  timeSpent: number;
  attempts: number;
  completionDate?: Date;
  score?: number;
  difficulty: "easy" | "moderate" | "challenging";
  engagementLevel: "low" | "medium" | "high";
  keyStrengths: string[];
  improvementAreas: string[];
}

export function ProgressTracker({ 
  course, 
  progress, 
  onModuleClick, 
  compact = false,
  showDetailed = true 
}: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"week" | "month" | "all">("week");

  // Calculate analytics
  const analytics = useMemo((): LearningAnalytics => {
    const completedModules = progress.completedModules.length;
    const totalModules = course.modules.length;
    const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    
    const quizScores = Object.values(progress.quizScores);
    const averageQuizScore = quizScores.length > 0 
      ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length 
      : 0;

    // Mock achievements for demonstration
    const achievements: Achievement[] = [
      {
        id: "first_module",
        title: "Getting Started",
        description: "Completed your first module",
        icon: "🎯",
        unlockedAt: new Date(),
        category: "completion",
        points: 10,
      },
      {
        id: "quiz_master",
        title: "Quiz Master",
        description: "Scored 90% or higher on a quiz",
        icon: "🧠",
        unlockedAt: new Date(),
        category: "performance",
        points: 25,
      },
    ];

    return {
      totalTimeSpent: progress.timeSpent,
      averageSessionTime: progress.timeSpent / Math.max(1, completedModules),
      completionRate,
      quizAverageScore: averageQuizScore,
      strongestAreas: ["Conceptual Understanding", "Problem Solving"],
      improvementAreas: ["Time Management", "Detail Attention"],
      learningVelocity: completedModules / 7, // modules per week
      engagementScore: Math.min(100, (progress.timeSpent / 3600) * 10 + completionRate),
      achievements,
      streakDays: 5,
      lastActiveDate: progress.lastAccessed,
    };
  }, [course.modules.length, progress]);

  // Module analytics
  const moduleAnalytics = useMemo((): ModuleAnalytics[] => {
    return course.modules.map(module => ({
      moduleId: module.id,
      timeSpent: Math.floor(Math.random() * 1800) + 300, // Mock data
      attempts: Math.floor(Math.random() * 3) + 1,
      completionDate: progress.completedModules.includes(module.id) 
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        : undefined,
      score: progress.quizScores[module.id],
      difficulty: ["easy", "moderate", "challenging"][Math.floor(Math.random() * 3)] as any,
      engagementLevel: ["low", "medium", "high"][Math.floor(Math.random() * 3)] as any,
      keyStrengths: ["Understanding concepts", "Applying knowledge"],
      improvementAreas: ["Speed", "Accuracy"],
    }));
  }, [course.modules, progress.completedModules, progress.quizScores]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Format date display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (compact) {
    return <CompactProgressTracker course={course} progress={progress} onModuleClick={onModuleClick} />;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{Math.round(analytics.completionRate)}%</p>
              </div>
            </div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{formatTime(analytics.totalTimeSpent)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatTime(analytics.averageSessionTime)} per module
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Quiz Average</p>
                <p className="text-2xl font-bold">{Math.round(analytics.quizAverageScore)}%</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(progress.quizScores).length} quizzes completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Streak</p>
                <p className="text-2xl font-bold">{analytics.streakDays}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              days active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      {showDetailed && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Module Progress</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Path Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.modules.map((module, index) => (
                      <div key={module.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {progress.completedModules.includes(module.id) ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : index === progress.currentModuleIndex ? (
                            <PlayCircle className="h-6 w-6 text-primary" />
                          ) : (
                            <Circle className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{module.title}</p>
                            <Badge variant={
                              module.type === "lesson" ? "default" :
                              module.type === "quiz" ? "secondary" : "outline"
                            } className="text-xs">
                              {module.type}
                            </Badge>
                          </div>
                          {progress.moduleProgress[module.id] !== undefined && (
                            <Progress 
                              value={progress.moduleProgress[module.id]} 
                              className="h-2 mt-1"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Learning Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Engagement Score</span>
                      <span>{Math.round(analytics.engagementScore)}/100</span>
                    </div>
                    <Progress value={analytics.engagementScore} />
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Strongest Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {analytics.strongestAreas.map((area, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Areas for Improvement</p>
                    <div className="flex flex-wrap gap-1">
                      {analytics.improvementAreas.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Learning Velocity</span>
                      <span>{analytics.learningVelocity.toFixed(1)} modules/week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Module Progress Details</h3>
              <div className="flex space-x-2">
                <Button
                  variant={selectedTimeframe === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("week")}
                >
                  Week
                </Button>
                <Button
                  variant={selectedTimeframe === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("month")}
                >
                  Month
                </Button>
                <Button
                  variant={selectedTimeframe === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe("all")}
                >
                  All Time
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {course.modules.map((module, index) => {
                const moduleData = moduleAnalytics.find(m => m.moduleId === module.id);
                const isCompleted = progress.completedModules.includes(module.id);
                const isCurrent = index === progress.currentModuleIndex;

                return (
                  <Card 
                    key={module.id}
                    className={`cursor-pointer transition-colors ${
                      isCurrent ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => onModuleClick?.(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : isCurrent ? (
                              <PlayCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{module.title}</h4>
                              <Badge variant={
                                module.type === "lesson" ? "default" :
                                module.type === "quiz" ? "secondary" : "outline"
                              } className="text-xs">
                                {module.type}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {module.description}
                            </p>

                            {moduleData && (
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Time Spent:</span>
                                  <span className="ml-1 font-medium">
                                    {formatTime(moduleData.timeSpent)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Attempts:</span>
                                  <span className="ml-1 font-medium">{moduleData.attempts}</span>
                                </div>
                                {moduleData.score && (
                                  <div>
                                    <span className="text-muted-foreground">Score:</span>
                                    <span className="ml-1 font-medium">{moduleData.score}%</span>
                                  </div>
                                )}
                                {moduleData.completionDate && (
                                  <div>
                                    <span className="text-muted-foreground">Completed:</span>
                                    <span className="ml-1 font-medium">
                                      {formatDate(moduleData.completionDate)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {progress.moduleProgress[module.id] !== undefined && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Progress</span>
                                  <span>{Math.round(progress.moduleProgress[module.id])}%</span>
                                </div>
                                <Progress 
                                  value={progress.moduleProgress[module.id]} 
                                  className="h-2"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {module.difficulty}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {module.duration}min
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={analytics.completionRate} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {Math.round(analytics.completionRate)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Quiz Performance</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={analytics.quizAverageScore} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {Math.round(analytics.quizAverageScore)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Engagement</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={analytics.engagementScore} className="w-20 h-2" />
                        <span className="text-sm font-medium">
                          {Math.round(analytics.engagementScore)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Learning Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Time:</span>
                        <p className="font-medium">{formatTime(analytics.totalTimeSpent)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Session:</span>
                        <p className="font-medium">{formatTime(analytics.averageSessionTime)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Modules/Week:</span>
                        <p className="font-medium">{analytics.learningVelocity.toFixed(1)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Streak:</span>
                        <p className="font-medium">{analytics.streakDays} days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Performance Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Quiz Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(progress.quizScores).map(([moduleId, score]) => {
                      const module = course.modules.find(m => m.id === moduleId);
                      if (!module) return null;

                      return (
                        <div key={moduleId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{module.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {module.type === "quiz" ? "Knowledge Check" : "Assessment"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={score} className="w-16 h-2" />
                            <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}>
                              {score}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    
                    {Object.keys(progress.quizScores).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No quiz scores available yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.achievements.map((achievement) => (
                <Card key={achievement.id} className="relative overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {achievement.category}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Star className="h-3 w-3 mr-1" />
                            {achievement.points} pts
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Unlocked {formatDate(achievement.unlockedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Course Completion</span>
                      <span>{progress.completedModules.length}/{course.modules.length}</span>
                    </div>
                    <Progress value={(progress.completedModules.length / course.modules.length) * 100} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Quiz Master (90%+ average)</span>
                      <span>{analytics.quizAverageScore >= 90 ? "Unlocked" : "In Progress"}</span>
                    </div>
                    <Progress value={Math.min(100, analytics.quizAverageScore)} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Dedicated Learner (7 day streak)</span>
                      <span>{analytics.streakDays}/7 days</span>
                    </div>
                    <Progress value={(analytics.streakDays / 7) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Compact Progress Tracker Component
function CompactProgressTracker({ 
  course, 
  progress, 
  onModuleClick 
}: { 
  course: Course; 
  progress: CourseProgress; 
  onModuleClick?: (moduleIndex: number) => void;
}) {
  const overallProgress = (progress.completedModules.length / course.modules.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Course Progress</span>
        <span className="text-sm text-muted-foreground">
          {Math.round(overallProgress)}% Complete
        </span>
      </div>
      
      <Progress value={overallProgress} className="w-full" />
      
      <div className="flex space-x-1">
        {course.modules.map((module, index) => (
          <button
            key={module.id}
            onClick={() => onModuleClick?.(index)}
            className={`flex-1 h-2 rounded-sm transition-colors ${
              progress.completedModules.includes(module.id)
                ? "bg-green-500"
                : index === progress.currentModuleIndex
                ? "bg-primary"
                : "bg-muted"
            }`}
            title={`${module.title} - ${
              progress.completedModules.includes(module.id)
                ? "Completed"
                : index === progress.currentModuleIndex
                ? "Current"
                : "Not Started"
            }`}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress.completedModules.length} of {course.modules.length} modules</span>
        <span>{Math.floor(progress.timeSpent / 60)} minutes spent</span>
      </div>
    </div>
  );
}
