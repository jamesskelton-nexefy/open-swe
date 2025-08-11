"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  BookOpen, 
  Clock, 
  Target, 
  Users, 
  CheckCircle,
  Circle,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  Brain,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  RotateCcw
} from "lucide-react";

// Import types from CourseEditor to maintain consistency
import type { CourseModule, Course } from "./CourseEditor";

export interface ContentPreviewProps {
  course: Course;
  onEdit?: () => void;
  fullscreen?: boolean;
}

interface PreviewState {
  currentModuleIndex: number;
  currentSectionIndex: number;
  completedModules: Set<string>;
  completedSections: Set<string>;
  isPlaying: boolean;
  showLearnerView: boolean;
  previewMode: "instructor" | "learner";
}

export function ContentPreview({ course, onEdit, fullscreen = false }: ContentPreviewProps) {
  const [previewState, setPreviewState] = useState<PreviewState>({
    currentModuleIndex: 0,
    currentSectionIndex: 0,
    completedModules: new Set(),
    completedSections: new Set(),
    isPlaying: false,
    showLearnerView: true,
    previewMode: "learner",
  });

  const [isFullscreen, setIsFullscreen] = useState(fullscreen);

  // Calculate progress
  const totalModules = course.modules.length;
  const completedModulesCount = previewState.completedModules.size;
  const overallProgress = totalModules > 0 ? (completedModulesCount / totalModules) * 100 : 0;

  // Get current module
  const currentModule = course.modules[previewState.currentModuleIndex];

  // Navigation functions
  const goToNextModule = useCallback(() => {
    if (previewState.currentModuleIndex < course.modules.length - 1) {
      setPreviewState(prev => ({
        ...prev,
        currentModuleIndex: prev.currentModuleIndex + 1,
        currentSectionIndex: 0,
      }));
    }
  }, [previewState.currentModuleIndex, course.modules.length]);

  const goToPreviousModule = useCallback(() => {
    if (previewState.currentModuleIndex > 0) {
      setPreviewState(prev => ({
        ...prev,
        currentModuleIndex: prev.currentModuleIndex - 1,
        currentSectionIndex: 0,
      }));
    }
  }, [previewState.currentModuleIndex]);

  const goToModule = useCallback((moduleIndex: number) => {
    setPreviewState(prev => ({
      ...prev,
      currentModuleIndex: moduleIndex,
      currentSectionIndex: 0,
    }));
  }, []);

  // Mark module as completed
  const markModuleCompleted = useCallback((moduleId: string) => {
    setPreviewState(prev => ({
      ...prev,
      completedModules: new Set([...prev.completedModules, moduleId]),
    }));
  }, []);

  // Toggle preview mode
  const togglePreviewMode = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      previewMode: prev.previewMode === "instructor" ? "learner" : "instructor",
    }));
  }, []);

  // Reset progress
  const resetProgress = useCallback(() => {
    setPreviewState(prev => ({
      ...prev,
      currentModuleIndex: 0,
      currentSectionIndex: 0,
      completedModules: new Set(),
      completedSections: new Set(),
    }));
  }, []);

  if (!course.title) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Course to Preview</h3>
            <p className="text-muted-foreground mb-4">
              Create a course with modules to see the preview.
            </p>
            {onEdit && (
              <Button onClick={onEdit}>
                Start Building Course
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}`}>
      {/* Preview Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <h2 className="text-xl font-bold">Course Preview</h2>
              <Badge variant={previewState.previewMode === "learner" ? "default" : "secondary"}>
                {previewState.previewMode === "learner" ? "Learner View" : "Instructor View"}
              </Badge>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm text-muted-foreground">
              {course.title} • {totalModules} modules • {course.estimatedDuration}min
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreviewMode}
            >
              {previewState.previewMode === "learner" ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewState.previewMode === "learner" ? "Instructor View" : "Learner View"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetProgress}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Progress
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            
            {onEdit && (
              <Button onClick={onEdit}>
                Edit Course
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Course Progress</span>
            <span>{Math.round(overallProgress)}% Complete</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Course Navigation */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Course Content</h3>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {course.modules.map((module, index) => (
                  <Card
                    key={module.id}
                    className={`cursor-pointer transition-colors ${
                      index === previewState.currentModuleIndex
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => goToModule(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {previewState.completedModules.has(module.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant={
                              module.type === "lesson" ? "default" :
                              module.type === "quiz" ? "secondary" : "outline"
                            } className="text-xs">
                              {module.type}
                            </Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.duration}min
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-sm leading-tight mb-1">
                            {module.title}
                          </h4>
                          
                          {module.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Module Navigation */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousModule}
                  disabled={previewState.currentModuleIndex === 0}
                >
                  <SkipBack className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">
                    Module {previewState.currentModuleIndex + 1} of {totalModules}
                  </div>
                  <h3 className="font-semibold">
                    {currentModule?.title || "No Module Selected"}
                  </h3>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextModule}
                  disabled={previewState.currentModuleIndex === course.modules.length - 1}
                >
                  Next
                  <SkipForward className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              {currentModule && (
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    currentModule.type === "lesson" ? "default" :
                    currentModule.type === "quiz" ? "secondary" : "outline"
                  }>
                    {currentModule.type}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {currentModule.duration} minutes
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Module Content */}
          <div className="flex-1 overflow-auto">
            {currentModule ? (
              <div className="p-6">
                <Tabs defaultValue="content" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
                    <TabsTrigger value="details">Module Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="mt-6">
                    <ModuleContentPreview 
                      module={currentModule} 
                      previewMode={previewState.previewMode}
                      onComplete={() => markModuleCompleted(currentModule.id)}
                      isCompleted={previewState.completedModules.has(currentModule.id)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="objectives" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="h-5 w-5 mr-2" />
                          Learning Objectives
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {currentModule.learningObjectives.length > 0 ? (
                          <ul className="space-y-2">
                            {currentModule.learningObjectives.map((objective, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground">
                            No learning objectives defined for this module.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="details" className="mt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Module Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Type:</span>
                            <Badge variant="outline">{currentModule.type}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Duration:</span>
                            <span className="text-sm">{currentModule.duration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Difficulty:</span>
                            <Badge variant="secondary">{currentModule.difficulty}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Order:</span>
                            <span className="text-sm">{currentModule.order + 1}</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            {currentModule.description || "No description provided."}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Module Selected</h3>
                  <p className="text-muted-foreground">
                    Select a module from the sidebar to preview its content.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Overview Panel (Instructor View) */}
      {previewState.previewMode === "instructor" && (
        <div className="border-t p-4 bg-muted/30">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{totalModules}</div>
              <div className="text-sm text-muted-foreground">Total Modules</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{course.estimatedDuration}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{course.learningObjectives.length}</div>
              <div className="text-sm text-muted-foreground">Learning Objectives</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Module Content Preview Component
interface ModuleContentPreviewProps {
  module: CourseModule;
  previewMode: "instructor" | "learner";
  onComplete: () => void;
  isCompleted: boolean;
}

function ModuleContentPreview({ 
  module, 
  previewMode, 
  onComplete, 
  isCompleted 
}: ModuleContentPreviewProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const renderModuleContent = () => {
    switch (module.type) {
      case "lesson":
        return <LessonPreview module={module} previewMode={previewMode} />;
      case "quiz":
      case "assessment":
        return <QuizPreview module={module} previewMode={previewMode} />;
      default:
        return <DefaultModulePreview module={module} />;
    }
  };

  return (
    <div className="space-y-6">
      {renderModuleContent()}
      
      {/* Completion Actions */}
      {previewMode === "learner" && !isCompleted && (
        <div className="flex justify-center pt-6">
          <Button onClick={onComplete} size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      )}
      
      {isCompleted && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Module Completed</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Lesson Preview Component
function LessonPreview({ module, previewMode }: { module: CourseModule; previewMode: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Lesson Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <h3>Introduction</h3>
            <p>
              This lesson covers the key concepts and practical applications related to {module.title.toLowerCase()}.
              You'll learn through interactive content, examples, and hands-on activities.
            </p>
            
            <h3>Main Content</h3>
            <p>
              The main content would be displayed here, including text, images, videos, and interactive elements.
              This is a preview of how the lesson would appear to learners.
            </p>
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Visual Content</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Video Content</p>
                </CardContent>
              </Card>
            </div>
            
            <h3>Practice Activity</h3>
            <p>
              Interactive practice activities would be embedded here to reinforce learning.
            </p>
            
            <h3>Summary</h3>
            <p>
              Key takeaways and next steps would be summarized here to help learners consolidate their understanding.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quiz Preview Component
function QuizPreview({ module, previewMode }: { module: CourseModule; previewMode: string }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const sampleQuestions = [
    {
      id: "q1",
      question: "What is the main topic of this module?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: "Option A",
    },
    {
      id: "q2",
      question: "Which of the following best describes the key concept?",
      options: ["Description A", "Description B", "Description C", "Description D"],
      correct: "Description B",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            {module.type === "quiz" ? "Knowledge Check" : "Assessment"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sampleQuestions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <h4 className="font-medium">
                Question {index + 1}: {question.question}
              </h4>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={selectedAnswers[question.id] === option}
                      onChange={(e) => setSelectedAnswers(prev => ({
                        ...prev,
                        [question.id]: e.target.value
                      }))}
                      className="text-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4">
            <Button>
              Submit {module.type === "quiz" ? "Quiz" : "Assessment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Default Module Preview Component
function DefaultModulePreview({ module }: { module: CourseModule }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Module Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Content Preview</h3>
          <p className="text-muted-foreground">
            This module contains {module.type} content that would be displayed here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

