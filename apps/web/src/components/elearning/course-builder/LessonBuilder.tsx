"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Save, 
  X,
  FileText, 
  Image, 
  Video, 
  Headphones,
  CheckSquare,
  MessageSquare,
  Target,
  Clock,
  Users,
  BookOpen,
  Lightbulb,
  Brain,
  Eye
} from "lucide-react";

// Content block types
export interface ContentBlock {
  id: string;
  type: "text" | "image" | "video" | "audio" | "interactive" | "quiz" | "reflection";
  title: string;
  content: string;
  metadata?: {
    duration?: number;
    url?: string;
    alt?: string;
    questions?: any[];
    interactionType?: string;
  };
  order: number;
}

// Lesson structure based on Gagne's Nine Events
export interface LessonSection {
  id: string;
  title: string;
  description: string;
  gagneEvent: number; // 1-9 for Gagne's Nine Events
  contentBlocks: ContentBlock[];
  estimatedDuration: number;
  order: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "lesson";
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  learningObjectives: string[];
  sections: LessonSection[];
  assessments: {
    formative: any[];
    summative: any[];
  };
  resources: {
    title: string;
    url: string;
    type: "reading" | "video" | "tool" | "reference";
  }[];
  order: number;
}

export interface LessonBuilderProps {
  initialLesson?: Partial<Lesson>;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

// Gagne's Nine Events of Instruction
const GAGNE_EVENTS = [
  { id: 1, title: "Gain Attention", description: "Capture learner interest and focus" },
  { id: 2, title: "Inform Objectives", description: "State learning objectives clearly" },
  { id: 3, title: "Stimulate Recall", description: "Activate prior knowledge" },
  { id: 4, title: "Present Content", description: "Deliver new information" },
  { id: 5, title: "Provide Guidance", description: "Offer learning guidance and examples" },
  { id: 6, title: "Elicit Performance", description: "Encourage active participation" },
  { id: 7, title: "Provide Feedback", description: "Give informative feedback" },
  { id: 8, title: "Assess Performance", description: "Evaluate learning achievement" },
  { id: 9, title: "Enhance Retention", description: "Aid retention and transfer" },
];

const CONTENT_BLOCK_TYPES = [
  { type: "text", icon: FileText, label: "Text Content", description: "Written content, explanations, instructions" },
  { type: "image", icon: Image, label: "Image", description: "Visual content, diagrams, illustrations" },
  { type: "video", icon: Video, label: "Video", description: "Video content, demonstrations, lectures" },
  { type: "audio", icon: Headphones, label: "Audio", description: "Audio content, podcasts, narration" },
  { type: "interactive", icon: CheckSquare, label: "Interactive", description: "Interactive elements, simulations" },
  { type: "quiz", icon: MessageSquare, label: "Knowledge Check", description: "Quick quiz or assessment" },
  { type: "reflection", icon: Brain, label: "Reflection", description: "Reflection prompts, discussion questions" },
];

export function LessonBuilder({ initialLesson, onSave, onCancel }: LessonBuilderProps) {
  const [lesson, setLesson] = useState<Lesson>({
    id: initialLesson?.id || `lesson_${Date.now()}`,
    title: initialLesson?.title || "",
    description: initialLesson?.description || "",
    type: "lesson",
    duration: initialLesson?.duration || 45,
    difficulty: initialLesson?.difficulty || "beginner",
    learningObjectives: initialLesson?.learningObjectives || [],
    sections: initialLesson?.sections || [],
    assessments: initialLesson?.assessments || { formative: [], summative: [] },
    resources: initialLesson?.resources || [],
    order: initialLesson?.order || 0,
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [newObjective, setNewObjective] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Create default sections based on Gagne's Nine Events
  const initializeDefaultSections = useCallback(() => {
    const defaultSections: LessonSection[] = [
      {
        id: "intro",
        title: "Introduction",
        description: "Gain attention and inform objectives",
        gagneEvent: 1,
        contentBlocks: [],
        estimatedDuration: 5,
        order: 0,
      },
      {
        id: "preparation",
        title: "Preparation",
        description: "Stimulate recall of prior knowledge",
        gagneEvent: 3,
        contentBlocks: [],
        estimatedDuration: 5,
        order: 1,
      },
      {
        id: "content",
        title: "Main Content",
        description: "Present new content with guidance",
        gagneEvent: 4,
        contentBlocks: [],
        estimatedDuration: 25,
        order: 2,
      },
      {
        id: "practice",
        title: "Practice & Application",
        description: "Elicit performance and provide feedback",
        gagneEvent: 6,
        contentBlocks: [],
        estimatedDuration: 8,
        order: 3,
      },
      {
        id: "conclusion",
        title: "Conclusion",
        description: "Assess performance and enhance retention",
        gagneEvent: 8,
        contentBlocks: [],
        estimatedDuration: 2,
        order: 4,
      },
    ];

    setLesson(prev => ({
      ...prev,
      sections: defaultSections,
    }));
  }, []);

  // Initialize with default sections if none exist
  React.useEffect(() => {
    if (lesson.sections.length === 0) {
      initializeDefaultSections();
    }
  }, [lesson.sections.length, initializeDefaultSections]);

  // Handle section drag and drop
  const handleSectionDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(lesson.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setLesson(prev => ({
      ...prev,
      sections: updatedItems,
    }));
  }, [lesson.sections]);

  // Handle content block drag and drop
  const handleBlockDragEnd = useCallback((result: DropResult, sectionId: string) => {
    if (!result.destination) return;

    const section = lesson.sections.find(s => s.id === sectionId);
    if (!section) return;

    const items = Array.from(section.contentBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, contentBlocks: updatedItems }
          : s
      ),
    }));
  }, [lesson.sections]);

  // Add content block to section
  const addContentBlock = useCallback((sectionId: string, type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: `block_${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: "",
      order: 0,
      metadata: {},
    };

    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              contentBlocks: [...s.contentBlocks, { ...newBlock, order: s.contentBlocks.length }],
            }
          : s
      ),
    }));

    setEditingBlock(newBlock);
  }, []);

  // Edit content block
  const editContentBlock = useCallback((block: ContentBlock) => {
    setEditingBlock(block);
  }, []);

  // Save content block
  const saveContentBlock = useCallback((updatedBlock: ContentBlock) => {
    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(s => ({
        ...s,
        contentBlocks: s.contentBlocks.map(b =>
          b.id === updatedBlock.id ? updatedBlock : b
        ),
      })),
    }));
    setEditingBlock(null);
  }, []);

  // Delete content block
  const deleteContentBlock = useCallback((sectionId: string, blockId: string) => {
    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              contentBlocks: s.contentBlocks.filter(b => b.id !== blockId),
            }
          : s
      ),
    }));
  }, []);

  // Add learning objective
  const addLearningObjective = useCallback(() => {
    if (newObjective.trim()) {
      setLesson(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  }, [newObjective]);

  // Remove learning objective
  const removeLearningObjective = useCallback((index: number) => {
    setLesson(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  }, []);

  // Update section
  const updateSection = useCallback((sectionId: string, updates: Partial<LessonSection>) => {
    setLesson(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  // Calculate total duration
  const totalDuration = lesson.sections.reduce((sum, section) => sum + section.estimatedDuration, 0);

  // Save lesson
  const handleSave = useCallback(() => {
    const updatedLesson = {
      ...lesson,
      duration: totalDuration,
    };
    onSave(updatedLesson);
  }, [lesson, totalDuration, onSave]);

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson Title *</Label>
            <Input
              id="lesson-title"
              value={lesson.title}
              onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lesson title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={lesson.difficulty}
              onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                setLesson(prev => ({ ...prev, difficulty: value }))
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
          <Label htmlFor="lesson-description">Lesson Description</Label>
          <Textarea
            id="lesson-description"
            value={lesson.description}
            onChange={(e) => setLesson(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what learners will achieve in this lesson"
            rows={2}
          />
        </div>

        {/* Learning Objectives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Target className="h-4 w-4 mr-2" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                placeholder="Add a learning objective"
                onKeyPress={(e) => e.key === "Enter" && addLearningObjective()}
              />
              <Button onClick={addLearningObjective} disabled={!newObjective.trim()} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {lesson.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>{objective}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLearningObjective(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="advanced-settings"
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
          />
          <Label htmlFor="advanced-settings">Show Advanced Settings</Label>
        </div>
      </div>

      {/* Lesson Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Lesson Structure
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              {totalDuration} minutes
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleSectionDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {lesson.sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center space-x-3">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    Event {section.gagneEvent}
                                  </Badge>
                                  <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                    className="font-semibold border-none p-0 h-auto bg-transparent"
                                  />
                                </div>
                                <Input
                                  value={section.description}
                                  onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                  className="text-sm text-muted-foreground border-none p-0 h-auto bg-transparent mt-1"
                                  placeholder="Section description"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <Input
                                    type="number"
                                    value={section.estimatedDuration}
                                    onChange={(e) => updateSection(section.id, { 
                                      estimatedDuration: parseInt(e.target.value) || 0 
                                    })}
                                    className="w-12 h-6 text-xs border-none p-0 bg-transparent"
                                  />
                                  min
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActiveSection(
                                    activeSection === section.id ? null : section.id
                                  )}
                                >
                                  {activeSection === section.id ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {activeSection === section.id && (
                            <CardContent className="pt-0">
                              <Separator className="mb-4" />
                              
                              {/* Content Blocks */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">Content Blocks</h4>
                                  <div className="flex space-x-1">
                                    {CONTENT_BLOCK_TYPES.map((blockType) => (
                                      <Button
                                        key={blockType.type}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addContentBlock(section.id, blockType.type as ContentBlock["type"])}
                                        title={blockType.description}
                                      >
                                        <blockType.icon className="h-3 w-3" />
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                <DragDropContext onDragEnd={(result) => handleBlockDragEnd(result, section.id)}>
                                  <Droppable droppableId={`blocks-${section.id}`}>
                                    {(provided) => (
                                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                        {section.contentBlocks.map((block, blockIndex) => (
                                          <Draggable key={block.id} draggableId={block.id} index={blockIndex}>
                                            {(provided, snapshot) => (
                                              <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex items-center space-x-2 p-2 bg-muted rounded ${
                                                  snapshot.isDragging ? "shadow-lg" : ""
                                                }`}
                                              >
                                                <div {...provided.dragHandleProps}>
                                                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                  {block.type}
                                                </Badge>
                                                <span className="flex-1 text-sm">{block.title}</span>
                                                <div className="flex space-x-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => editContentBlock(block)}
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteContentBlock(section.id, block.id)}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </DragDropContext>

                                {section.contentBlocks.length === 0 && (
                                  <div className="text-center py-4 text-sm text-muted-foreground">
                                    No content blocks yet. Add content using the buttons above.
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!lesson.title}>
          <Save className="h-4 w-4 mr-2" />
          Save Lesson
        </Button>
      </div>

      {/* Content Block Editor Modal */}
      {editingBlock && (
        <ContentBlockEditor
          block={editingBlock}
          onSave={saveContentBlock}
          onCancel={() => setEditingBlock(null)}
        />
      )}
    </div>
  );
}

// Content Block Editor Component
interface ContentBlockEditorProps {
  block: ContentBlock;
  onSave: (block: ContentBlock) => void;
  onCancel: () => void;
}

function ContentBlockEditor({ block, onSave, onCancel }: ContentBlockEditorProps) {
  const [editedBlock, setEditedBlock] = useState<ContentBlock>(block);

  const handleSave = useCallback(() => {
    onSave(editedBlock);
  }, [editedBlock, onSave]);

  return (
    <Card className="fixed inset-4 z-50 bg-background shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit {editedBlock.type.charAt(0).toUpperCase() + editedBlock.type.slice(1)} Block</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="block-title">Title</Label>
          <Input
            id="block-title"
            value={editedBlock.title}
            onChange={(e) => setEditedBlock(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter block title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="block-content">Content</Label>
          <Textarea
            id="block-content"
            value={editedBlock.content}
            onChange={(e) => setEditedBlock(prev => ({ ...prev, content: e.target.value }))}
            placeholder={`Enter ${editedBlock.type} content`}
            rows={6}
          />
        </div>

        {/* Type-specific fields */}
        {(editedBlock.type === "image" || editedBlock.type === "video" || editedBlock.type === "audio") && (
          <div className="space-y-2">
            <Label htmlFor="block-url">URL</Label>
            <Input
              id="block-url"
              value={editedBlock.metadata?.url || ""}
              onChange={(e) => setEditedBlock(prev => ({
                ...prev,
                metadata: { ...prev.metadata, url: e.target.value }
              }))}
              placeholder="Enter media URL"
            />
          </div>
        )}

        {editedBlock.type === "image" && (
          <div className="space-y-2">
            <Label htmlFor="block-alt">Alt Text</Label>
            <Input
              id="block-alt"
              value={editedBlock.metadata?.alt || ""}
              onChange={(e) => setEditedBlock(prev => ({
                ...prev,
                metadata: { ...prev.metadata, alt: e.target.value }
              }))}
              placeholder="Enter alt text for accessibility"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Block
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

