"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  BookOpen, 
  FileText, 
  HelpCircle,
  Clock,
  Target,
  Users
} from "lucide-react";
import { LessonBuilder } from "./LessonBuilder";
import { QuizCreator } from "./QuizCreator";
import { ContentPreview } from "./ContentPreview";

// Types based on our e-learning types
interface CourseModule {
  id: string;
  title: string;
  description: string;
  type: "lesson" | "quiz" | "assessment";
  duration: number;
  order: number;
  content?: any;
  learningObjectives: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface Course {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  learningObjectives: string[];
  modules: CourseModule[];
  tags: string[];
  prerequisites: string[];
}

interface CourseEditorProps {
  initialCourse?: Partial<Course>;
  onSave?: (course: Course) => void;
  onPreview?: (course: Course) => void;
}

export function CourseEditor({ initialCourse, onSave, onPreview }: CourseEditorProps) {
  const [course, setCourse] = useState<Course>({
    id: initialCourse?.id || `course_${Date.now()}`,
    title: initialCourse?.title || "",
    description: initialCourse?.description || "",
    targetAudience: initialCourse?.targetAudience || "",
    estimatedDuration: initialCourse?.estimatedDuration || 60,
    difficulty: initialCourse?.difficulty || "beginner",
    learningObjectives: initialCourse?.learningObjectives || [],
    modules: initialCourse?.modules || [],
    tags: initialCourse?.tags || [],
    prerequisites: initialCourse?.prerequisites || [],
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [newObjective, setNewObjective] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPrerequisite, setNewPrerequisite] = useState("");

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(course.modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setCourse(prev => ({
      ...prev,
      modules: updatedItems,
    }));
  }, [course.modules]);

  // Add new module
  const addModule = useCallback((type: "lesson" | "quiz" | "assessment") => {
    const newModule: CourseModule = {
      id: `module_${Date.now()}`,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: "",
      type,
      duration: type === "quiz" ? 15 : type === "assessment" ? 30 : 45,
      order: course.modules.length,
      learningObjectives: [],
      difficulty: course.difficulty,
    };

    setCourse(prev => ({
      ...prev,
      modules: [...prev.modules, newModule],
    }));

    setEditingModule(newModule);
    setShowModuleDialog(true);
  }, [course.modules.length, course.difficulty]);

  // Edit module
  const editModule = useCallback((module: CourseModule) => {
    setEditingModule(module);
    setShowModuleDialog(true);
  }, []);

  // Delete module
  const deleteModule = useCallback((moduleId: string) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId),
    }));
  }, []);

  // Save module changes
  const saveModule = useCallback((updatedModule: CourseModule) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map(m => 
        m.id === updatedModule.id ? updatedModule : m
      ),
    }));
    setShowModuleDialog(false);
    setEditingModule(null);
  }, []);

  // Add learning objective
  const addLearningObjective = useCallback(() => {
    if (newObjective.trim()) {
      setCourse(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  }, [newObjective]);

  // Remove learning objective
  const removeLearningObjective = useCallback((index: number) => {
    setCourse(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  }, []);

  // Add tag
  const addTag = useCallback(() => {
    if (newTag.trim() && !course.tags.includes(newTag.trim())) {
      setCourse(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  }, [newTag, course.tags]);

  // Remove tag
  const removeTag = useCallback((tag: string) => {
    setCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  }, []);

  // Add prerequisite
  const addPrerequisite = useCallback(() => {
    if (newPrerequisite.trim() && !course.prerequisites.includes(newPrerequisite.trim())) {
      setCourse(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()],
      }));
      setNewPrerequisite("");
    }
  }, [newPrerequisite, course.prerequisites]);

  // Remove prerequisite
  const removePrerequisite = useCallback((prerequisite: string) => {
    setCourse(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(p => p !== prerequisite),
    }));
  }, []);

  // Calculate total duration
  const totalDuration = course.modules.reduce((sum, module) => sum + module.duration, 0);

  return (
    <div className="flex h-screen bg-background">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold">Course Editor</h1>
                <p className="text-muted-foreground">
                  {course.title || "Untitled Course"} • {course.modules.length} modules • {totalDuration}min
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => onPreview?.(course)}
                disabled={!course.title || course.modules.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => onSave?.(course)}
                disabled={!course.title}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Course
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Course Overview</TabsTrigger>
              <TabsTrigger value="modules">Modules & Content</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Course Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Course Title *</Label>
                        <Input
                          id="title"
                          value={course.title}
                          onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter course title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select
                          value={course.difficulty}
                          onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                            setCourse(prev => ({ ...prev, difficulty: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Course Description</Label>
                      <Textarea
                        id="description"
                        value={course.description}
                        onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what learners will gain from this course"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Input
                          id="audience"
                          value={course.targetAudience}
                          onChange={(e) => setCourse(prev => ({ ...prev, targetAudience: e.target.value }))}
                          placeholder="e.g., Undergraduate students, Professionals"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={course.estimatedDuration}
                          onChange={(e) => setCourse(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                          placeholder="60"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Objectives */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Learning Objectives
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Add a learning objective"
                        onKeyPress={(e) => e.key === "Enter" && addLearningObjective()}
                      />
                      <Button onClick={addLearningObjective} disabled={!newObjective.trim()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {course.learningObjectives.map((objective, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span>{objective}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLearningObjective(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tags and Prerequisites */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) => e.key === "Enter" && addTag()}
                        />
                        <Button onClick={addTag} disabled={!newTag.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer">
                            {tag}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 ml-2"
                              onClick={() => removeTag(tag)}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Prerequisites</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          value={newPrerequisite}
                          onChange={(e) => setNewPrerequisite(e.target.value)}
                          placeholder="Add a prerequisite"
                          onKeyPress={(e) => e.key === "Enter" && addPrerequisite()}
                        />
                        <Button onClick={addPrerequisite} disabled={!newPrerequisite.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {course.prerequisites.map((prerequisite) => (
                          <div key={prerequisite} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{prerequisite}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrerequisite(prerequisite)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Modules & Content Tab */}
            <TabsContent value="modules" className="flex-1 overflow-auto p-6">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Add Module Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button onClick={() => addModule("lesson")} variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                      <Button onClick={() => addModule("quiz")} variant="outline">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Add Quiz
                      </Button>
                      <Button onClick={() => addModule("assessment")} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Add Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Modules List */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="modules">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {course.modules.map((module, index) => (
                          <Draggable key={module.id} draggableId={module.id} index={index}>
                            {(provided, snapshot) => (
                              <Card
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-4">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <Badge variant={
                                          module.type === "lesson" ? "default" :
                                          module.type === "quiz" ? "secondary" : "outline"
                                        }>
                                          {module.type}
                                        </Badge>
                                        <h3 className="font-semibold">{module.title}</h3>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                          <Clock className="h-4 w-4 mr-1" />
                                          {module.duration}min
                                        </div>
                                      </div>
                                      {module.description && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {module.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => editModule(module)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteModule(module.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {course.modules.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start building your course by adding lessons, quizzes, or assessments.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="flex-1 overflow-hidden">
              <ContentPreview course={course} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Module Editor Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule?.type === "lesson" ? "Edit Lesson" :
               editingModule?.type === "quiz" ? "Edit Quiz" : "Edit Assessment"}
            </DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="mt-4">
              {editingModule.type === "lesson" && (
                <LessonBuilder
                  initialLesson={editingModule}
                  onSave={saveModule}
                  onCancel={() => setShowModuleDialog(false)}
                />
              )}
              {(editingModule.type === "quiz" || editingModule.type === "assessment") && (
                <QuizCreator
                  initialQuiz={editingModule}
                  onSave={saveModule}
                  onCancel={() => setShowModuleDialog(false)}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
