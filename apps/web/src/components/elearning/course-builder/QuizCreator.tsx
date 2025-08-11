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
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  GripVertical, 
  Edit, 
  Trash2, 
  Save, 
  X,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  Brain,
  FileText,
  RotateCcw
} from "lucide-react";

// Question types based on our e-learning types
interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer" | "essay" | "matching" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  tags: string[];
  feedback: {
    correct: string;
    incorrect: string;
    partial?: string;
  };
  timeLimit?: number;
  order: number;
}

interface QuizSettings {
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showFeedback: boolean;
  allowReview: boolean;
  showCorrectAnswers: boolean;
  preventCheating: boolean;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "assessment";
  duration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  learningObjectives: string[];
  questions: QuizQuestion[];
  settings: QuizSettings;
  totalPoints: number;
  order: number;
}

interface QuizCreatorProps {
  initialQuiz?: Partial<Quiz>;
  onSave: (quiz: Quiz) => void;
  onCancel: () => void;
}

const QUESTION_TYPES = [
  { 
    type: "multiple_choice", 
    label: "Multiple Choice", 
    icon: HelpCircle,
    description: "Single correct answer from multiple options"
  },
  { 
    type: "true_false", 
    label: "True/False", 
    icon: CheckCircle,
    description: "Binary choice question"
  },
  { 
    type: "short_answer", 
    label: "Short Answer", 
    icon: FileText,
    description: "Brief written response"
  },
  { 
    type: "essay", 
    label: "Essay", 
    icon: FileText,
    description: "Extended written response"
  },
  { 
    type: "fill_blank", 
    label: "Fill in the Blank", 
    icon: AlertCircle,
    description: "Complete missing text"
  },
];

const BLOOM_LEVELS = [
  { level: "remember", label: "Remember", color: "bg-blue-100 text-blue-800" },
  { level: "understand", label: "Understand", color: "bg-green-100 text-green-800" },
  { level: "apply", label: "Apply", color: "bg-yellow-100 text-yellow-800" },
  { level: "analyze", label: "Analyze", color: "bg-orange-100 text-orange-800" },
  { level: "evaluate", label: "Evaluate", color: "bg-red-100 text-red-800" },
  { level: "create", label: "Create", color: "bg-purple-100 text-purple-800" },
];

export function QuizCreator({ initialQuiz, onSave, onCancel }: QuizCreatorProps) {
  const [quiz, setQuiz] = useState<Quiz>({
    id: initialQuiz?.id || `quiz_${Date.now()}`,
    title: initialQuiz?.title || "",
    description: initialQuiz?.description || "",
    type: (initialQuiz?.type as "quiz" | "assessment") || "quiz",
    duration: initialQuiz?.duration || 15,
    difficulty: initialQuiz?.difficulty || "beginner",
    learningObjectives: initialQuiz?.learningObjectives || [],
    questions: initialQuiz?.questions || [],
    settings: initialQuiz?.settings || {
      attempts: 3,
      passingScore: 80,
      randomizeQuestions: false,
      randomizeOptions: false,
      showFeedback: true,
      allowReview: true,
      showCorrectAnswers: true,
      preventCheating: false,
    },
    totalPoints: initialQuiz?.totalPoints || 0,
    order: initialQuiz?.order || 0,
  });

  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newObjective, setNewObjective] = useState("");

  // Handle question drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(quiz.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setQuiz(prev => ({
      ...prev,
      questions: updatedItems,
    }));
  }, [quiz.questions]);

  // Add new question
  const addQuestion = useCallback((type: QuizQuestion["type"]) => {
    const newQuestion: QuizQuestion = {
      id: `question_${Date.now()}`,
      type,
      question: "",
      options: type === "multiple_choice" ? ["", "", "", ""] : 
               type === "true_false" ? ["True", "False"] : undefined,
      correctAnswer: type === "multiple_choice" ? "" : 
                    type === "true_false" ? "True" : "",
      explanation: "",
      points: 1,
      difficulty: quiz.difficulty,
      bloomLevel: "remember",
      tags: [],
      feedback: {
        correct: "Correct! Well done.",
        incorrect: "Incorrect. Please review the material.",
      },
      order: quiz.questions.length,
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));

    setEditingQuestion(newQuestion);
  }, [quiz.questions.length, quiz.difficulty]);

  // Edit question
  const editQuestion = useCallback((question: QuizQuestion) => {
    setEditingQuestion(question);
  }, []);

  // Save question
  const saveQuestion = useCallback((updatedQuestion: QuizQuestion) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      ),
    }));
    setEditingQuestion(null);
  }, []);

  // Delete question
  const deleteQuestion = useCallback((questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId),
    }));
  }, []);

  // Add learning objective
  const addLearningObjective = useCallback(() => {
    if (newObjective.trim()) {
      setQuiz(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()],
      }));
      setNewObjective("");
    }
  }, [newObjective]);

  // Remove learning objective
  const removeLearningObjective = useCallback((index: number) => {
    setQuiz(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  }, []);

  // Calculate total points
  const totalPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0);

  // Update quiz settings
  const updateSettings = useCallback((updates: Partial<QuizSettings>) => {
    setQuiz(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Save quiz
  const handleSave = useCallback(() => {
    const updatedQuiz = {
      ...quiz,
      totalPoints,
    };
    onSave(updatedQuiz);
  }, [quiz, totalPoints, onSave]);

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">Quiz Title *</Label>
            <Input
              id="quiz-title"
              value={quiz.title}
              onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter quiz title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiz-type">Type</Label>
            <Select
              value={quiz.type}
              onValueChange={(value: "quiz" | "assessment") =>
                setQuiz(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz (Formative)</SelectItem>
                <SelectItem value="assessment">Assessment (Summative)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quiz-description">Description</Label>
          <Textarea
            id="quiz-description"
            value={quiz.description}
            onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose and scope of this quiz"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <Select
              value={quiz.difficulty}
              onValueChange={(value: "beginner" | "intermediate" | "advanced") =>
                setQuiz(prev => ({ ...prev, difficulty: value }))
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
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={quiz.duration}
              onChange={(e) => setQuiz(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              placeholder="15"
            />
          </div>
          <div className="space-y-2">
            <Label>Total Points</Label>
            <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
              {totalPoints}
            </div>
          </div>
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
              {quiz.learningObjectives.map((objective, index) => (
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

        {/* Quiz Settings Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="quiz-settings"
            checked={showSettings}
            onCheckedChange={setShowSettings}
          />
          <Label htmlFor="quiz-settings">Show Quiz Settings</Label>
        </div>

        {/* Quiz Settings */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quiz Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <Input
                    type="number"
                    value={quiz.settings.timeLimit || ""}
                    onChange={(e) => updateSettings({ 
                      timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Attempts</Label>
                  <Input
                    type="number"
                    value={quiz.settings.attempts}
                    onChange={(e) => updateSettings({ attempts: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Passing Score: {quiz.settings.passingScore}%</Label>
                <Slider
                  value={[quiz.settings.passingScore]}
                  onValueChange={([value]) => updateSettings({ passingScore: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="randomize-questions"
                    checked={quiz.settings.randomizeQuestions}
                    onCheckedChange={(checked) => updateSettings({ randomizeQuestions: checked })}
                  />
                  <Label htmlFor="randomize-questions">Randomize Questions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="randomize-options"
                    checked={quiz.settings.randomizeOptions}
                    onCheckedChange={(checked) => updateSettings({ randomizeOptions: checked })}
                  />
                  <Label htmlFor="randomize-options">Randomize Options</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-feedback"
                    checked={quiz.settings.showFeedback}
                    onCheckedChange={(checked) => updateSettings({ showFeedback: checked })}
                  />
                  <Label htmlFor="show-feedback">Show Feedback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-review"
                    checked={quiz.settings.allowReview}
                    onCheckedChange={(checked) => updateSettings({ allowReview: checked })}
                  />
                  <Label htmlFor="allow-review">Allow Review</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-correct"
                    checked={quiz.settings.showCorrectAnswers}
                    onCheckedChange={(checked) => updateSettings({ showCorrectAnswers: checked })}
                  />
                  <Label htmlFor="show-correct">Show Correct Answers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="prevent-cheating"
                    checked={quiz.settings.preventCheating}
                    onCheckedChange={(checked) => updateSettings({ preventCheating: checked })}
                  />
                  <Label htmlFor="prevent-cheating">Prevent Cheating</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Questions ({quiz.questions.length})
            </div>
            <div className="flex space-x-2">
              {QUESTION_TYPES.map((questionType) => (
                <Button
                  key={questionType.type}
                  variant="outline"
                  size="sm"
                  onClick={() => addQuestion(questionType.type as QuizQuestion["type"])}
                  title={questionType.description}
                >
                  <questionType.icon className="h-4 w-4 mr-1" />
                  {questionType.label}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <Draggable key={question.id} draggableId={question.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? "shadow-lg" : ""}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">
                                    Q{index + 1}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {question.type.replace("_", " ")}
                                  </Badge>
                                  <Badge 
                                    className={BLOOM_LEVELS.find(b => b.level === question.bloomLevel)?.color}
                                  >
                                    {BLOOM_LEVELS.find(b => b.level === question.bloomLevel)?.label}
                                  </Badge>
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <Target className="h-3 w-3 mr-1" />
                                    {question.points} pts
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="font-medium">
                                    {question.question || "Untitled Question"}
                                  </p>
                                  
                                  {question.options && (
                                    <div className="space-y-1">
                                      {question.options.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center space-x-2 text-sm">
                                          <div className={`w-2 h-2 rounded-full ${
                                            option === question.correctAnswer ? "bg-green-500" : "bg-gray-300"
                                          }`} />
                                          <span>{option}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editQuestion(question)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteQuestion(question.id)}
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

          {quiz.questions.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your quiz by adding questions using the buttons above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!quiz.title || quiz.questions.length === 0}>
          <Save className="h-4 w-4 mr-2" />
          Save Quiz
        </Button>
      </div>

      {/* Question Editor Modal */}
      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}

// Question Editor Component
interface QuestionEditorProps {
  question: QuizQuestion;
  onSave: (question: QuizQuestion) => void;
  onCancel: () => void;
}

function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [editedQuestion, setEditedQuestion] = useState<QuizQuestion>(question);

  const handleSave = useCallback(() => {
    onSave(editedQuestion);
  }, [editedQuestion, onSave]);

  const updateOption = useCallback((index: number, value: string) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options?.map((opt, i) => i === index ? value : opt),
    }));
  }, []);

  const addOption = useCallback(() => {
    setEditedQuestion(prev => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setEditedQuestion(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
    }));
  }, []);

  return (
    <Card className="fixed inset-4 z-50 bg-background shadow-lg overflow-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Edit Question</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-text">Question *</Label>
            <Textarea
              id="question-text"
              value={editedQuestion.question}
              onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="question-type">Type</Label>
              <Select
                value={editedQuestion.type}
                onValueChange={(value: QuizQuestion["type"]) => {
                  const newQuestion = { ...editedQuestion, type: value };
                  if (value === "multiple_choice" && !newQuestion.options) {
                    newQuestion.options = ["", "", "", ""];
                  } else if (value === "true_false") {
                    newQuestion.options = ["True", "False"];
                    newQuestion.correctAnswer = "True";
                  } else if (value === "short_answer" || value === "essay") {
                    newQuestion.options = undefined;
                  }
                  setEditedQuestion(newQuestion);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloom-level">Bloom's Level</Label>
              <Select
                value={editedQuestion.bloomLevel}
                onValueChange={(value: QuizQuestion["bloomLevel"]) =>
                  setEditedQuestion(prev => ({ ...prev, bloomLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOM_LEVELS.map((level) => (
                    <SelectItem key={level.level} value={level.level}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                value={editedQuestion.points}
                onChange={(e) => setEditedQuestion(prev => ({ 
                  ...prev, 
                  points: parseInt(e.target.value) || 1 
                }))}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Options (for multiple choice and true/false) */}
        {editedQuestion.options && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Answer Options</Label>
              {editedQuestion.type === "multiple_choice" && (
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {editedQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroup
                    value={editedQuestion.correctAnswer as string}
                    onValueChange={(value) => setEditedQuestion(prev => ({ 
                      ...prev, 
                      correctAnswer: value 
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                    </div>
                  </RadioGroup>
                  
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  
                  {editedQuestion.type === "multiple_choice" && editedQuestion.options!.length > 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer (for non-multiple choice) */}
        {!editedQuestion.options && (
          <div className="space-y-2">
            <Label htmlFor="correct-answer">Correct Answer</Label>
            <Textarea
              id="correct-answer"
              value={editedQuestion.correctAnswer as string}
              onChange={(e) => setEditedQuestion(prev => ({ 
                ...prev, 
                correctAnswer: e.target.value 
              }))}
              placeholder="Enter the correct answer"
              rows={editedQuestion.type === "essay" ? 4 : 2}
            />
          </div>
        )}

        {/* Explanation */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explanation</Label>
          <Textarea
            id="explanation"
            value={editedQuestion.explanation}
            onChange={(e) => setEditedQuestion(prev => ({ ...prev, explanation: e.target.value }))}
            placeholder="Explain why this is the correct answer"
            rows={3}
          />
        </div>

        {/* Feedback */}
        <div className="space-y-4">
          <Label>Feedback Messages</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correct-feedback">Correct Answer Feedback</Label>
              <Textarea
                id="correct-feedback"
                value={editedQuestion.feedback.correct}
                onChange={(e) => setEditedQuestion(prev => ({
                  ...prev,
                  feedback: { ...prev.feedback, correct: e.target.value }
                }))}
                placeholder="Message for correct answers"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incorrect-feedback">Incorrect Answer Feedback</Label>
              <Textarea
                id="incorrect-feedback"
                value={editedQuestion.feedback.incorrect}
                onChange={(e) => setEditedQuestion(prev => ({
                  ...prev,
                  feedback: { ...prev.feedback, incorrect: e.target.value }
                }))}
                placeholder="Message for incorrect answers"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!editedQuestion.question}>
            Save Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
