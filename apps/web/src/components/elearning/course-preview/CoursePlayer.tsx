"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  CheckCircle,
  Circle,
  FileText,
  Image,
  Video,
  Headphones,
  HelpCircle,
  Brain,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FastForward
} from "lucide-react";
import { ProgressTracker } from "./ProgressTracker";
import { InteractiveQuiz } from "./InteractiveQuiz";

// Import types from course builder
import type { Course, CourseModule } from "../course-builder/CourseEditor";

export interface CoursePlayerProps {
  course: Course;
  onComplete?: (courseId: string) => void;
  onProgress?: (progress: CourseProgress) => void;
  initialProgress?: CourseProgress;
  playerSettings?: PlayerSettings;
}

export interface CourseProgress {
  courseId: string;
  currentModuleIndex: number;
  currentSectionIndex: number;
  completedModules: string[];
  completedSections: string[];
  timeSpent: number; // in seconds
  lastAccessed: Date;
  overallProgress: number; // percentage
  moduleProgress: Record<string, number>; // module ID -> percentage
  quizScores: Record<string, number>; // quiz ID -> score
  bookmarks: string[]; // section IDs
  notes: Record<string, string>; // section ID -> note
}

export interface PlayerSettings {
  autoPlay: boolean;
  showTranscripts: boolean;
  playbackSpeed: number;
  volume: number;
  theme: "light" | "dark" | "auto";
  fontSize: "small" | "medium" | "large";
  reducedMotion: boolean;
  highContrast: boolean;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  showSettings: boolean;
  showNotes: boolean;
  currentNote: string;
}

const DEFAULT_SETTINGS: PlayerSettings = {
  autoPlay: false,
  showTranscripts: true,
  playbackSpeed: 1.0,
  volume: 0.8,
  theme: "auto",
  fontSize: "medium",
  reducedMotion: false,
  highContrast: false,
};

export function CoursePlayer({ 
  course, 
  onComplete, 
  onProgress, 
  initialProgress,
  playerSettings = DEFAULT_SETTINGS 
}: CoursePlayerProps) {
  const [progress, setProgress] = useState<CourseProgress>(
    initialProgress || {
      courseId: course.id,
      currentModuleIndex: 0,
      currentSectionIndex: 0,
      completedModules: [],
      completedSections: [],
      timeSpent: 0,
      lastAccessed: new Date(),
      overallProgress: 0,
      moduleProgress: {},
      quizScores: {},
      bookmarks: [],
      notes: {},
    }
  );

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isFullscreen: false,
    showSettings: false,
    showNotes: false,
    currentNote: "",
  });

  const [settings, setSettings] = useState<PlayerSettings>(playerSettings);

  // Get current module and section
  const currentModule = course.modules[progress.currentModuleIndex];
  const totalModules = course.modules.length;

  // Calculate overall progress
  const calculateOverallProgress = useCallback(() => {
    const completedCount = progress.completedModules.length;
    const currentModuleProgress = progress.moduleProgress[currentModule?.id] || 0;
    const totalProgress = (completedCount + currentModuleProgress / 100) / totalModules * 100;
    return Math.min(100, Math.max(0, totalProgress));
  }, [progress.completedModules.length, progress.moduleProgress, currentModule?.id, totalModules]);

  // Update progress
  const updateProgress = useCallback((updates: Partial<CourseProgress>) => {
    const newProgress = {
      ...progress,
      ...updates,
      lastAccessed: new Date(),
      overallProgress: calculateOverallProgress(),
    };
    setProgress(newProgress);
    onProgress?.(newProgress);
  }, [progress, calculateOverallProgress, onProgress]);

  // Navigation functions
  const goToNextModule = useCallback(() => {
    if (progress.currentModuleIndex < course.modules.length - 1) {
      updateProgress({
        currentModuleIndex: progress.currentModuleIndex + 1,
        currentSectionIndex: 0,
      });
    }
  }, [progress.currentModuleIndex, course.modules.length, updateProgress]);

  const goToPreviousModule = useCallback(() => {
    if (progress.currentModuleIndex > 0) {
      updateProgress({
        currentModuleIndex: progress.currentModuleIndex - 1,
        currentSectionIndex: 0,
      });
    }
  }, [progress.currentModuleIndex, updateProgress]);

  const goToModule = useCallback((moduleIndex: number) => {
    updateProgress({
      currentModuleIndex: moduleIndex,
      currentSectionIndex: 0,
    });
  }, [updateProgress]);

  // Mark module as completed
  const markModuleCompleted = useCallback((moduleId: string) => {
    if (!progress.completedModules.includes(moduleId)) {
      const newCompletedModules = [...progress.completedModules, moduleId];
      updateProgress({
        completedModules: newCompletedModules,
        moduleProgress: {
          ...progress.moduleProgress,
          [moduleId]: 100,
        },
      });

      // Check if course is completed
      if (newCompletedModules.length === course.modules.length) {
        onComplete?.(course.id);
      }
    }
  }, [progress.completedModules, progress.moduleProgress, updateProgress, course.modules.length, course.id, onComplete]);

  // Player controls
  const togglePlayPause = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  // Time tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playerState.isPlaying) {
      interval = setInterval(() => {
        updateProgress({
          timeSpent: progress.timeSpent + 1,
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playerState.isPlaying, progress.timeSpent, updateProgress]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-screen bg-background ${playerState.isFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Player Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold">{course.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Module {progress.currentModuleIndex + 1} of {totalModules}</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(progress.timeSpent)}
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  {Math.round(calculateOverallProgress())}% Complete
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlayerState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {playerState.isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <ProgressTracker 
            course={course}
            progress={progress}
            onModuleClick={goToModule}
            compact={true}
          />
        </div>
      </div>

      {/* Main Content Area */}
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
                      index === progress.currentModuleIndex
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => goToModule(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {progress.completedModules.includes(module.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : index === progress.currentModuleIndex ? (
                            <Play className="h-5 w-5 text-primary" />
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

                          {/* Module Progress */}
                          {progress.moduleProgress[module.id] !== undefined && (
                            <div className="mt-2">
                              <Progress 
                                value={progress.moduleProgress[module.id]} 
                                className="h-1"
                              />
                            </div>
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

        {/* Main Player Area */}
        <div className="flex-1 flex flex-col">
          {/* Module Content */}
          <div className="flex-1 overflow-auto">
            {currentModule ? (
              <div className="p-6">
                <ModulePlayer
                  module={currentModule}
                  progress={progress}
                  settings={settings}
                  onComplete={() => markModuleCompleted(currentModule.id)}
                  onProgress={(moduleProgress) => {
                    updateProgress({
                      moduleProgress: {
                        ...progress.moduleProgress,
                        [currentModule.id]: moduleProgress,
                      },
                    });
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Course Completed!</h3>
                  <p className="text-muted-foreground mb-4">
                    Congratulations on completing the course.
                  </p>
                  <Button onClick={() => onComplete?.(course.id)}>
                    View Certificate
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousModule}
                  disabled={progress.currentModuleIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                >
                  {playerState.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextModule}
                  disabled={progress.currentModuleIndex === course.modules.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  {currentModule?.title}
                </div>
                <Badge variant="outline">
                  {Math.round(calculateOverallProgress())}% Complete
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {playerState.showSettings && (
        <PlayerSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          onClose={() => setPlayerState(prev => ({ ...prev, showSettings: false }))}
        />
      )}
    </div>
  );
}

// Module Player Component
interface ModulePlayerProps {
  module: CourseModule;
  progress: CourseProgress;
  settings: PlayerSettings;
  onComplete: () => void;
  onProgress: (progress: number) => void;
}

function ModulePlayer({ module, progress, settings, onComplete, onProgress }: ModulePlayerProps) {
  const [moduleProgress, setModuleProgress] = useState(0);

  const handleModuleComplete = useCallback(() => {
    setModuleProgress(100);
    onProgress(100);
    onComplete();
  }, [onProgress, onComplete]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{module.title}</h2>
          <p className="text-muted-foreground mt-1">{module.description}</p>
        </div>
        <Badge variant={
          module.type === "lesson" ? "default" :
          module.type === "quiz" ? "secondary" : "outline"
        }>
          {module.type}
        </Badge>
      </div>

      {/* Module Content */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="objectives">Learning Objectives</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-6">
          {module.type === "lesson" && (
            <LessonContent 
              module={module} 
              settings={settings}
              onProgress={setModuleProgress}
              onComplete={handleModuleComplete}
            />
          )}
          {(module.type === "quiz" || module.type === "assessment") && (
            <InteractiveQuiz
              quiz={module.content}
              onComplete={(score) => {
                setModuleProgress(100);
                onProgress(100);
                handleModuleComplete();
              }}
              settings={settings}
            />
          )}
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
              {module.learningObjectives.length > 0 ? (
                <ul className="space-y-3">
                  {module.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
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
        
        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Additional resources and references would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span>Module Progress</span>
          <span>{Math.round(moduleProgress)}%</span>
        </div>
        <Progress value={moduleProgress} className="w-full" />
      </div>

      {/* Complete Module Button */}
      {moduleProgress < 100 && (
        <div className="flex justify-center pt-4">
          <Button onClick={handleModuleComplete} size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Complete
          </Button>
        </div>
      )}
    </div>
  );
}

// Lesson Content Component
function LessonContent({ 
  module, 
  settings, 
  onProgress, 
  onComplete 
}: { 
  module: CourseModule; 
  settings: PlayerSettings;
  onProgress: (progress: number) => void;
  onComplete: () => void;
}) {
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = 5; // Mock sections

  useEffect(() => {
    const progress = ((currentSection + 1) / totalSections) * 100;
    onProgress(progress);
    
    if (currentSection === totalSections - 1) {
      setTimeout(onComplete, 1000);
    }
  }, [currentSection, totalSections, onProgress, onComplete]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Lesson Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose max-w-none">
            <h3>Introduction</h3>
            <p>
              Welcome to this lesson on {module.title.toLowerCase()}. In this comprehensive module, 
              you'll explore key concepts, practical applications, and real-world examples.
            </p>
            
            <h3>Key Concepts</h3>
            <p>
              This section covers the fundamental principles and theories that form the foundation 
              of understanding in this subject area.
            </p>
            
            <div className="grid grid-cols-2 gap-4 my-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Visual Learning Materials</p>
                  <p className="text-xs text-muted-foreground">Diagrams and illustrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">Video Demonstrations</p>
                  <p className="text-xs text-muted-foreground">Step-by-step tutorials</p>
                </CardContent>
              </Card>
            </div>
            
            <h3>Practical Applications</h3>
            <p>
              Learn how to apply these concepts in real-world scenarios through interactive 
              exercises and case studies.
            </p>
            
            <h3>Summary and Next Steps</h3>
            <p>
              Review the key takeaways from this lesson and prepare for the next module 
              in your learning journey.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Section
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Section {currentSection + 1} of {totalSections}
            </span>
            
            <Button
              onClick={() => setCurrentSection(Math.min(totalSections - 1, currentSection + 1))}
              disabled={currentSection === totalSections - 1}
            >
              Next Section
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Player Settings Panel Component
function PlayerSettingsPanel({ 
  settings, 
  onSettingsChange, 
  onClose 
}: { 
  settings: PlayerSettings;
  onSettingsChange: (settings: PlayerSettings) => void;
  onClose: () => void;
}) {
  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Player Settings</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Playback Speed</label>
          <select 
            value={settings.playbackSpeed}
            onChange={(e) => onSettingsChange({ ...settings, playbackSpeed: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1.0}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2.0}>2.0x</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Font Size</label>
          <select 
            value={settings.fontSize}
            onChange={(e) => onSettingsChange({ ...settings, fontSize: e.target.value as any })}
            className="w-full p-2 border rounded"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Auto Play</label>
          <input
            type="checkbox"
            checked={settings.autoPlay}
            onChange={(e) => onSettingsChange({ ...settings, autoPlay: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Show Transcripts</label>
          <input
            type="checkbox"
            checked={settings.showTranscripts}
            onChange={(e) => onSettingsChange({ ...settings, showTranscripts: e.target.checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">High Contrast</label>
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => onSettingsChange({ ...settings, highContrast: e.target.checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
