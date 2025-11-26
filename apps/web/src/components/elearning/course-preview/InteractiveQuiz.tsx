"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Brain,
  Target,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lightbulb,
  Award,
  TrendingUp,
  BarChart3,
  Timer,
  Zap
} from "lucide-react";

// Import types from course builder
import type { Quiz, QuizQuestion } from "../course-builder/QuizCreator";
import type { PlayerSettings } from "./CoursePlayer";

export interface InteractiveQuizProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  settings?: PlayerSettings;
  allowRetake?: boolean;
  showHints?: boolean;
  timedMode?: boolean;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpent: number;
  answers: QuizAnswer[];
  passed: boolean;
  completedAt: Date;
  attempt: number;
  feedback: string;
  detailedResults: QuestionResult[];
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
  timeSpent: number;
}

export interface QuestionResult {
  questionId: string;
  question: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  explanation: string;
  feedback: string;
  bloomLevel: string;
  difficulty: string;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string | string[]>;
  timeSpent: number;
  questionStartTime: number;
  questionTimes: Record<string, number>;
  isSubmitted: boolean;
  showResults: boolean;
  showExplanations: boolean;
  flaggedQuestions: Set<string>;
  attempt: number;
}

const BLOOM_LEVEL_COLORS = {
  remember: "bg-blue-100 text-blue-800",
  understand: "bg-green-100 text-green-800",
  apply: "bg-yellow-100 text-yellow-800",
  analyze: "bg-orange-100 text-orange-800",
  evaluate: "bg-red-100 text-red-800",
  create: "bg-purple-100 text-purple-800",
};

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
};

export function InteractiveQuiz({ 
  quiz, 
  onComplete, 
  settings,
  allowRetake = true,
  showHints = true,
  timedMode = false
}: InteractiveQuizProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    timeSpent: 0,
    questionStartTime: Date.now(),
    questionTimes: {},
    isSubmitted: false,
    showResults: false,
    showExplanations: false,
    flaggedQuestions: new Set(),
    attempt: 1,
  });

  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : null
  );

  // Current question
  const currentQuestion = quiz.questions[quizState.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress = ((quizState.currentQuestionIndex + 1) / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setQuizState(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1,
      }));

      if (timeRemaining !== null) {
        setTimeRemaining(prev => {
          if (prev !== null && prev > 0) {
            return prev - 1;
          } else if (prev === 0) {
            handleSubmitQuiz();
            return 0;
          }
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Question timer effect
  useEffect(() => {
    setQuizState(prev => ({
      ...prev,
      questionStartTime: Date.now(),
    }));
  }, [quizState.currentQuestionIndex]);

  // Calculate quiz results
  const calculateResults = useCallback((): QuizResult => {
    const detailedResults: QuestionResult[] = quiz.questions.map(question => {
      const userAnswer = quizState.answers[question.id];
      const isCorrect = Array.isArray(question.correctAnswer)
        ? Array.isArray(userAnswer) && 
          question.correctAnswer.every(ans => userAnswer.includes(ans)) &&
          userAnswer.every(ans => question.correctAnswer.includes(ans))
        : userAnswer === question.correctAnswer;
      
      const points = isCorrect ? question.points : 0;

      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer || "",
        correctAnswer: question.correctAnswer,
        isCorrect,
        points,
        maxPoints: question.points,
        explanation: question.explanation,
        feedback: isCorrect ? question.feedback.correct : question.feedback.incorrect,
        bloomLevel: question.bloomLevel,
        difficulty: question.difficulty,
      };
    });

    const totalPoints = detailedResults.reduce((sum, result) => sum + result.points, 0);
    const maxPoints = quiz.questions.reduce((sum, question) => sum + question.points, 0);
    const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
    const passed = percentage >= quiz.settings.passingScore;

    const answers: QuizAnswer[] = quiz.questions.map(question => {
      const result = detailedResults.find(r => r.questionId === question.id)!;
      return {
        questionId: question.id,
        answer: result.userAnswer,
        isCorrect: result.isCorrect,
        points: result.points,
        timeSpent: quizState.questionTimes[question.id] || 0,
      };
    });

    let feedback = "";
    if (passed) {
      if (percentage >= 95) {
        feedback = "Excellent work! You've demonstrated mastery of the material.";
      } else if (percentage >= 85) {
        feedback = "Great job! You have a solid understanding of the concepts.";
      } else {
        feedback = "Good work! You've passed the assessment.";
      }
    } else {
      feedback = `You scored ${Math.round(percentage)}%, which is below the passing score of ${quiz.settings.passingScore}%. Review the material and try again.`;
    }

    return {
      quizId: quiz.id,
      score: totalPoints,
      totalPoints: maxPoints,
      percentage,
      timeSpent: quizState.timeSpent,
      answers,
      passed,
      completedAt: new Date(),
      attempt: quizState.attempt,
      feedback,
      detailedResults,
    };
  }, [quiz, quizState.answers, quizState.timeSpent, quizState.questionTimes, quizState.attempt]);

  // Navigation functions
  const goToQuestion = useCallback((index: number) => {
    // Save time spent on current question
    const timeSpent = Date.now() - quizState.questionStartTime;
    setQuizState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      questionTimes: {
        ...prev.questionTimes,
        [currentQuestion?.id]: (prev.questionTimes[currentQuestion?.id] || 0) + timeSpent,
      },
    }));
  }, [currentQuestion?.id, quizState.questionStartTime]);

  const goToNextQuestion = useCallback(() => {
    if (quizState.currentQuestionIndex < totalQuestions - 1) {
      goToQuestion(quizState.currentQuestionIndex + 1);
    }
  }, [quizState.currentQuestionIndex, totalQuestions, goToQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    if (quizState.currentQuestionIndex > 0) {
      goToQuestion(quizState.currentQuestionIndex - 1);
    }
  }, [quizState.currentQuestionIndex, goToQuestion]);

  // Answer handling
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setQuizState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
    }));
  }, []);

  // Flag question
  const toggleQuestionFlag = useCallback((questionId: string) => {
    setQuizState(prev => {
      const newFlagged = new Set(prev.flaggedQuestions);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return {
        ...prev,
        flaggedQuestions: newFlagged,
      };
    });
  }, []);

  // Submit quiz
  const handleSubmitQuiz = useCallback(() => {
    const result = calculateResults();
    setQuizState(prev => ({
      ...prev,
      isSubmitted: true,
      showResults: true,
    }));
    onComplete(result);
  }, [calculateResults, onComplete]);

  // Retake quiz
  const handleRetakeQuiz = useCallback(() => {
    setQuizState(prev => ({
      currentQuestionIndex: 0,
      answers: {},
      timeSpent: 0,
      questionStartTime: Date.now(),
      questionTimes: {},
      isSubmitted: false,
      showResults: false,
      showExplanations: false,
      flaggedQuestions: new Set(),
      attempt: prev.attempt + 1,
    }));
    setTimeRemaining(quiz.settings.timeLimit ? quiz.settings.timeLimit * 60 : null);
  }, [quiz.settings.timeLimit]);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get answer completion status
  const getAnswerStatus = () => {
    const answeredCount = Object.keys(quizState.answers).length;
    return { answered: answeredCount, total: totalQuestions };
  };

  const answerStatus = getAnswerStatus();

  if (quizState.showResults) {
    const result = calculateResults();
    return <QuizResults result={result} quiz={quiz} onRetake={allowRetake ? handleRetakeQuiz : undefined} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2" />
                {quiz.title}
              </CardTitle>
              <p className="text-muted-foreground mt-1">{quiz.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Attempt {quizState.attempt}
              </Badge>
              {timeRemaining !== null && (
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Question {quizState.currentQuestionIndex + 1} of {totalQuestions}</span>
                <span>{answerStatus.answered}/{answerStatus.total} answered</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* Quiz Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>Passing: {quiz.settings.passingScore}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Time: {formatTime(quizState.timeSpent)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>Points: {quiz.totalPoints}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>Flagged: {quizState.flaggedQuestions.size}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={index === quizState.currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => goToQuestion(index)}
                className={`relative ${
                  quizState.answers[question.id] ? "bg-green-50 border-green-200" : ""
                } ${
                  quizState.flaggedQuestions.has(question.id) ? "bg-yellow-50 border-yellow-200" : ""
                }`}
              >
                {index + 1}
                {quizState.flaggedQuestions.has(question.id) && (
                  <Flag className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline">
                    Question {quizState.currentQuestionIndex + 1}
                  </Badge>
                  <Badge className={BLOOM_LEVEL_COLORS[currentQuestion.bloomLevel]}>
                    {currentQuestion.bloomLevel}
                  </Badge>
                  <Badge className={DIFFICULTY_COLORS[currentQuestion.difficulty]}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Target className="h-3 w-3 mr-1" />
                    {currentQuestion.points} pts
                  </div>
                </div>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestion.question}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleQuestionFlag(currentQuestion.id)}
                className={quizState.flaggedQuestions.has(currentQuestion.id) ? "text-yellow-500" : ""}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuestionInput
              question={currentQuestion}
              value={quizState.answers[currentQuestion.id]}
              onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              showHints={showHints}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={quizState.currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex space-x-2">
                {quizState.currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={answerStatus.answered === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button onClick={goToNextQuestion}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiz Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Answered:</span>
              <p className="font-medium">{answerStatus.answered}/{answerStatus.total}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Flagged:</span>
              <p className="font-medium">{quizState.flaggedQuestions.size}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Time Spent:</span>
              <p className="font-medium">{formatTime(quizState.timeSpent)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Remaining:</span>
              <p className="font-medium">
                {timeRemaining !== null ? formatTime(timeRemaining) : "Unlimited"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Question Input Component
interface QuestionInputProps {
  question: QuizQuestion;
  value: string | string[] | undefined;
  onChange: (answer: string | string[]) => void;
  showHints?: boolean;
}

function QuestionInput({ question, value, onChange, showHints }: QuestionInputProps) {
  const [showHint, setShowHint] = useState(false);

  switch (question.type) {
    case "multiple_choice":
      return (
        <div className="space-y-3">
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {showHints && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHint(!showHint)}
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              {showHint && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p className="text-blue-800">
                    Consider the key concepts discussed in the lesson. Look for the most comprehensive answer.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );

    case "true_false":
      return (
        <RadioGroup
          value={value as string}
          onValueChange={onChange}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="True" id="true" />
            <Label htmlFor="true" className="cursor-pointer">True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="False" id="false" />
            <Label htmlFor="false" className="cursor-pointer">False</Label>
          </div>
        </RadioGroup>
      );

    case "short_answer":
      return (
        <div className="space-y-2">
          <Input
            value={value as string || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Provide a brief, concise answer.
          </p>
        </div>
      );

    case "essay":
      return (
        <div className="space-y-2">
          <Textarea
            value={value as string || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your detailed response..."
            rows={6}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Provide a detailed explanation with examples and reasoning.
          </p>
        </div>
      );

    case "fill_blank":
      return (
        <div className="space-y-2">
          <Input
            value={value as string || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Fill in the blank..."
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Complete the missing text.
          </p>
        </div>
      );

    default:
      return (
        <div className="p-4 border border-dashed rounded text-center text-muted-foreground">
          Question type not supported: {question.type}
        </div>
      );
  }
}

// Quiz Results Component
interface QuizResultsProps {
  result: QuizResult;
  quiz: Quiz;
  onRetake?: () => void;
}

function QuizResults({ result, quiz, onRetake }: QuizResultsProps) {
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <Card className={`${result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {result.passed ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
              <div>
                <CardTitle className="text-2xl">
                  {result.passed ? "Congratulations!" : "Keep Learning!"}
                </CardTitle>
                <p className="text-muted-foreground">
                  {result.passed ? "You passed the quiz!" : "You can retake this quiz to improve your score."}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {Math.round(result.percentage)}%
              </div>
              <div className="text-sm text-muted-foreground">
                {result.score}/{result.totalPoints} points
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={result.percentage} className="w-full h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Score:</span>
                <p className="font-medium">{result.score}/{result.totalPoints}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">{Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Attempt:</span>
                <p className="font-medium">{result.attempt}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Passing:</span>
                <p className="font-medium">{quiz.settings.passingScore}%</p>
              </div>
            </div>

            <div className="p-4 bg-background rounded border">
              <p className="text-sm">{result.feedback}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Performance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Bloom's Level */}
            <div>
              <h4 className="font-medium mb-3">By Cognitive Level</h4>
              <div className="space-y-2">
                {Object.entries(
                  result.detailedResults.reduce((acc, result) => {
                    if (!acc[result.bloomLevel]) {
                      acc[result.bloomLevel] = { correct: 0, total: 0 };
                    }
                    acc[result.bloomLevel].total++;
                    if (result.isCorrect) acc[result.bloomLevel].correct++;
                    return acc;
                  }, {} as Record<string, { correct: number; total: number }>)
                ).map(([level, stats]) => (
                  <div key={level} className="flex items-center justify-between">
                    <Badge className={BLOOM_LEVEL_COLORS[level as keyof typeof BLOOM_LEVEL_COLORS]}>
                      {level}
                    </Badge>
                    <span className="text-sm">
                      {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* By Difficulty */}
            <div>
              <h4 className="font-medium mb-3">By Difficulty</h4>
              <div className="space-y-2">
                {Object.entries(
                  result.detailedResults.reduce((acc, result) => {
                    if (!acc[result.difficulty]) {
                      acc[result.difficulty] = { correct: 0, total: 0 };
                    }
                    acc[result.difficulty].total++;
                    if (result.isCorrect) acc[result.difficulty].correct++;
                    return acc;
                  }, {} as Record<string, { correct: number; total: number }>)
                ).map(([difficulty, stats]) => (
                  <div key={difficulty} className="flex items-center justify-between">
                    <Badge className={DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS]}>
                      {difficulty}
                    </Badge>
                    <span className="text-sm">
                      {stats.correct}/{stats.total} ({Math.round((stats.correct / stats.total) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Stats */}
            <div>
              <h4 className="font-medium mb-3">Overall Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Correct Answers:</span>
                  <span className="font-medium">
                    {result.detailedResults.filter(r => r.isCorrect).length}/{result.detailedResults.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Time per Question:</span>
                  <span className="font-medium">
                    {Math.round(result.timeSpent / result.detailedResults.length)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Points Earned:</span>
                  <span className="font-medium">{result.score}/{result.totalPoints}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question Review</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailed(!showDetailed)}
            >
              {showDetailed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showDetailed ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </CardHeader>
        {showDetailed && (
          <CardContent className="space-y-4">
            {result.detailedResults.map((questionResult, index) => (
              <div key={questionResult.questionId} className="border rounded p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge className={BLOOM_LEVEL_COLORS[questionResult.bloomLevel as keyof typeof BLOOM_LEVEL_COLORS]}>
                        {questionResult.bloomLevel}
                      </Badge>
                      <Badge className={DIFFICULTY_COLORS[questionResult.difficulty as keyof typeof DIFFICULTY_COLORS]}>
                        {questionResult.difficulty}
                      </Badge>
                    </div>
                    <p className="font-medium">{questionResult.question}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {questionResult.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium">
                      {questionResult.points}/{questionResult.maxPoints}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Your Answer:</span>
                    <p className="font-medium">{Array.isArray(questionResult.userAnswer) 
                      ? questionResult.userAnswer.join(", ") 
                      : questionResult.userAnswer || "No answer provided"}</p>
                  </div>
                  
                  {!questionResult.isCorrect && (
                    <div>
                      <span className="text-muted-foreground">Correct Answer:</span>
                      <p className="font-medium text-green-700">
                        {Array.isArray(questionResult.correctAnswer) 
                          ? questionResult.correctAnswer.join(", ") 
                          : questionResult.correctAnswer}
                      </p>
                    </div>
                  )}

                  {questionResult.explanation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-blue-800">{questionResult.explanation}</p>
                    </div>
                  )}

                  <div className="p-3 bg-muted rounded">
                    <p>{questionResult.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        {onRetake && !result.passed && (
          <Button onClick={onRetake} size="lg">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
        )}
        {result.passed && (
          <Button size="lg">
            <Award className="h-4 w-4 mr-2" />
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  );
}
