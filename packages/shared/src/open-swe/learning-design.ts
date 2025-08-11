import {
  LearningObjective,
  ContentBlock,
  Assessment,
  Lesson,
  LearningModule,
  Course,
  BloomLevel,
  DifficultyLevel,
  LearningStyle,
  AssessmentType,
  ContentType,
  QuizQuestion,
} from "./elearning-types.js";

// ADDIE Model Implementation
export interface ADDIEPhase {
  name: "analysis" | "design" | "development" | "implementation" | "evaluation";
  description: string;
  activities: string[];
  deliverables: string[];
  stakeholders: string[];
}

export const ADDIE_FRAMEWORK: Record<ADDIEPhase["name"], ADDIEPhase> = {
  analysis: {
    name: "analysis",
    description: "Identify learning needs, audience characteristics, and constraints",
    activities: [
      "Conduct learner analysis",
      "Perform task analysis",
      "Identify learning objectives",
      "Analyze existing resources",
      "Define success criteria",
    ],
    deliverables: [
      "Learner profile",
      "Learning needs assessment",
      "Task analysis report",
      "Resource inventory",
      "Project constraints document",
    ],
    stakeholders: ["Subject matter experts", "Target learners", "Stakeholders", "Project managers"],
  },
  design: {
    name: "design",
    description: "Create detailed learning objectives, assessment strategy, and instructional approach",
    activities: [
      "Write detailed learning objectives",
      "Design assessment strategy",
      "Select instructional strategies",
      "Create content outline",
      "Design user experience",
    ],
    deliverables: [
      "Learning objectives document",
      "Assessment plan",
      "Instructional design document",
      "Content outline",
      "Storyboard/wireframes",
    ],
    stakeholders: ["Instructional designers", "UX designers", "Subject matter experts"],
  },
  development: {
    name: "development",
    description: "Create and assemble learning materials and assessments",
    activities: [
      "Develop learning content",
      "Create assessments",
      "Build interactive elements",
      "Integrate multimedia",
      "Conduct alpha testing",
    ],
    deliverables: [
      "Learning materials",
      "Assessments and quizzes",
      "Interactive components",
      "Multimedia assets",
      "Alpha version",
    ],
    stakeholders: ["Content developers", "Multimedia specialists", "Developers", "QA testers"],
  },
  implementation: {
    name: "implementation",
    description: "Deploy the learning solution and train facilitators",
    activities: [
      "Deploy learning platform",
      "Train facilitators/instructors",
      "Conduct pilot testing",
      "Launch to target audience",
      "Monitor initial usage",
    ],
    deliverables: [
      "Deployed learning system",
      "Facilitator training materials",
      "Pilot test results",
      "Launch plan",
      "Usage analytics setup",
    ],
    stakeholders: ["IT support", "Facilitators", "Learners", "System administrators"],
  },
  evaluation: {
    name: "evaluation",
    description: "Assess effectiveness and gather feedback for continuous improvement",
    activities: [
      "Collect learner feedback",
      "Analyze learning outcomes",
      "Measure performance impact",
      "Identify improvement areas",
      "Plan revisions",
    ],
    deliverables: [
      "Evaluation report",
      "Learner feedback analysis",
      "Performance metrics",
      "Improvement recommendations",
      "Revision plan",
    ],
    stakeholders: ["Evaluators", "Learners", "Stakeholders", "Management"],
  },
};

// Bloom's Taxonomy Action Verbs
export const BLOOM_ACTION_VERBS: Record<BloomLevel, string[]> = {
  remember: [
    "define", "describe", "identify", "know", "label", "list", "match", "name", "outline", "recall",
    "recognize", "reproduce", "select", "state", "tell", "who", "what", "when", "where", "why",
  ],
  understand: [
    "classify", "compare", "contrast", "demonstrate", "explain", "extend", "illustrate", "infer",
    "interpret", "outline", "relate", "rephrase", "show", "summarize", "translate", "paraphrase",
    "discuss", "distinguish", "estimate", "give examples",
  ],
  apply: [
    "apply", "build", "choose", "construct", "develop", "experiment with", "identify", "interview",
    "make use of", "model", "organize", "plan", "select", "solve", "utilize", "demonstrate",
    "employ", "illustrate", "operate", "practice", "schedule", "sketch", "use",
  ],
  analyze: [
    "analyze", "break down", "compare", "contrast", "diagram", "deconstruct", "differentiate",
    "discriminate", "distinguish", "identify", "illustrate", "infer", "outline", "relate",
    "select", "separate", "examine", "categorize", "classify", "investigate",
  ],
  evaluate: [
    "appraise", "argue", "assess", "attach", "choose", "compare", "defend", "estimate", "judge",
    "predict", "rate", "core", "select", "support", "value", "evaluate", "critique", "justify",
    "recommend", "validate", "prioritize", "rank", "test", "measure",
  ],
  create: [
    "assemble", "construct", "create", "design", "develop", "formulate", "build", "invent",
    "make", "originate", "plan", "produce", "role play", "devise", "generate", "integrate",
    "modify", "rearrange", "reorganize", "revise", "rewrite", "summarize", "write", "compose",
  ],
};

// Learning Style Templates
export interface LearningStyleTemplate {
  style: LearningStyle;
  description: string;
  preferredContentTypes: ContentType[];
  instructionalStrategies: string[];
  assessmentMethods: AssessmentType[];
  designPrinciples: string[];
}

export const LEARNING_STYLE_TEMPLATES: Record<LearningStyle, LearningStyleTemplate> = {
  visual: {
    style: "visual",
    description: "Learners who prefer visual representations of information",
    preferredContentTypes: ["image", "video", "interactive", "simulation"],
    instructionalStrategies: [
      "Use diagrams and flowcharts",
      "Include infographics and visual summaries",
      "Provide mind maps and concept maps",
      "Use color coding and visual hierarchy",
      "Include charts, graphs, and data visualizations",
    ],
    assessmentMethods: ["multiple_choice", "practical"],
    designPrinciples: [
      "Minimize text-heavy content",
      "Use consistent visual design",
      "Provide visual navigation cues",
      "Include visual feedback",
      "Use whitespace effectively",
    ],
  },
  auditory: {
    style: "auditory",
    description: "Learners who prefer listening and verbal instruction",
    preferredContentTypes: ["audio", "video", "interactive"],
    instructionalStrategies: [
      "Include narrated content",
      "Provide discussion forums",
      "Use storytelling techniques",
      "Include podcasts and audio lectures",
      "Encourage verbal explanations",
    ],
    assessmentMethods: ["short_answer", "essay", "peer_review"],
    designPrinciples: [
      "Provide audio alternatives",
      "Include sound feedback",
      "Use clear, conversational language",
      "Provide transcripts for accessibility",
      "Include pronunciation guides",
    ],
  },
  kinesthetic: {
    style: "kinesthetic",
    description: "Learners who prefer hands-on, experiential learning",
    preferredContentTypes: ["interactive", "simulation", "assignment"],
    instructionalStrategies: [
      "Include hands-on activities",
      "Provide simulations and virtual labs",
      "Use case studies and scenarios",
      "Include drag-and-drop interactions",
      "Encourage experimentation",
    ],
    assessmentMethods: ["practical"],
    designPrinciples: [
      "Maximize interactivity",
      "Provide immediate feedback",
      "Include trial-and-error opportunities",
      "Use progressive disclosure",
      "Allow self-paced exploration",
    ],
  },
  reading_writing: {
    style: "reading_writing",
    description: "Learners who prefer text-based information and written exercises",
    preferredContentTypes: ["text", "assignment"],
    instructionalStrategies: [
      "Provide comprehensive written materials",
      "Include note-taking opportunities",
      "Use structured text formats",
      "Provide reading lists and references",
      "Include written exercises",
    ],
    assessmentMethods: ["essay", "short_answer", "multiple_choice"],
    designPrinciples: [
      "Use clear typography",
      "Provide good text structure",
      "Include search functionality",
      "Allow note-taking and highlighting",
      "Provide downloadable resources",
    ],
  },
};

// Assessment Strategy Templates
export interface AssessmentStrategy {
  type: "diagnostic" | "formative" | "summative";
  description: string;
  timing: string;
  purpose: string[];
  methods: AssessmentType[];
  designPrinciples: string[];
}

export const ASSESSMENT_STRATEGIES: Record<AssessmentStrategy["type"], AssessmentStrategy> = {
  diagnostic: {
    type: "diagnostic",
    description: "Pre-learning assessment to identify prior knowledge and learning needs",
    timing: "Before learning begins",
    purpose: [
      "Identify prior knowledge",
      "Assess skill levels",
      "Determine learning needs",
      "Personalize learning path",
      "Set appropriate difficulty level",
    ],
    methods: ["multiple_choice", "short_answer", "practical"],
    designPrinciples: [
      "Keep assessments brief",
      "Focus on prerequisite knowledge",
      "Provide immediate results",
      "Use adaptive questioning",
      "Avoid penalizing learners",
    ],
  },
  formative: {
    type: "formative",
    description: "Ongoing assessment during learning to provide feedback and guide instruction",
    timing: "Throughout the learning process",
    purpose: [
      "Monitor learning progress",
      "Provide immediate feedback",
      "Identify learning gaps",
      "Adjust instruction",
      "Motivate learners",
    ],
    methods: ["multiple_choice", "true_false", "short_answer", "practical"],
    designPrinciples: [
      "Provide immediate feedback",
      "Allow multiple attempts",
      "Focus on learning, not grading",
      "Use low-stakes assessments",
      "Include self-assessment opportunities",
    ],
  },
  summative: {
    type: "summative",
    description: "End-of-learning assessment to evaluate achievement of learning objectives",
    timing: "At the end of learning units",
    purpose: [
      "Evaluate learning achievement",
      "Assign grades or certification",
      "Measure program effectiveness",
      "Provide completion evidence",
      "Support credentialing",
    ],
    methods: ["multiple_choice", "essay", "practical", "peer_review"],
    designPrinciples: [
      "Align with learning objectives",
      "Use authentic assessment tasks",
      "Ensure reliability and validity",
      "Provide clear rubrics",
      "Include comprehensive coverage",
    ],
  },
};

// Pedagogical Approach Templates
export interface PedagogicalApproach {
  name: string;
  description: string;
  principles: string[];
  instructionalStrategies: string[];
  assessmentApproach: string[];
  suitableFor: string[];
  implementation: string[];
}

export const PEDAGOGICAL_APPROACHES: Record<string, PedagogicalApproach> = {
  constructivist: {
    name: "Constructivist Learning",
    description: "Learners actively construct knowledge through experience and reflection",
    principles: [
      "Learning is an active process",
      "Knowledge is constructed by learners",
      "Prior experience influences learning",
      "Social interaction enhances learning",
      "Authentic contexts improve transfer",
    ],
    instructionalStrategies: [
      "Problem-based learning",
      "Case studies and scenarios",
      "Collaborative projects",
      "Reflection activities",
      "Inquiry-based learning",
    ],
    assessmentApproach: [
      "Portfolio assessment",
      "Peer evaluation",
      "Self-reflection",
      "Authentic assessment",
      "Project-based evaluation",
    ],
    suitableFor: [
      "Complex problem-solving skills",
      "Critical thinking development",
      "Professional development",
      "Adult learners",
      "Advanced topics",
    ],
    implementation: [
      "Provide rich, authentic contexts",
      "Encourage exploration and discovery",
      "Support collaborative learning",
      "Include reflection opportunities",
      "Connect to prior experience",
    ],
  },
  behaviorist: {
    name: "Behaviorist Learning",
    description: "Learning through reinforcement and repetition of desired behaviors",
    principles: [
      "Learning is observable behavior change",
      "Reinforcement strengthens learning",
      "Practice leads to mastery",
      "Clear objectives guide learning",
      "Immediate feedback improves performance",
    ],
    instructionalStrategies: [
      "Drill and practice",
      "Programmed instruction",
      "Immediate feedback",
      "Repetition and reinforcement",
      "Clear learning objectives",
    ],
    assessmentApproach: [
      "Frequent quizzes",
      "Objective testing",
      "Performance measurement",
      "Mastery-based assessment",
      "Immediate feedback",
    ],
    suitableFor: [
      "Skill acquisition",
      "Factual knowledge",
      "Procedural learning",
      "Basic concepts",
      "Compliance training",
    ],
    implementation: [
      "Break content into small units",
      "Provide immediate feedback",
      "Use positive reinforcement",
      "Include frequent practice",
      "Measure observable outcomes",
    ],
  },
  cognitivist: {
    name: "Cognitivist Learning",
    description: "Learning through mental processing and information organization",
    principles: [
      "Learning involves mental processes",
      "Information processing is key",
      "Schema development is important",
      "Cognitive load affects learning",
      "Transfer requires understanding",
    ],
    instructionalStrategies: [
      "Advance organizers",
      "Chunking information",
      "Elaboration techniques",
      "Mnemonics and memory aids",
      "Concept mapping",
    ],
    assessmentApproach: [
      "Concept mapping",
      "Explain reasoning",
      "Transfer tasks",
      "Problem-solving assessment",
      "Knowledge application",
    ],
    suitableFor: [
      "Conceptual understanding",
      "Information processing",
      "Academic subjects",
      "Complex knowledge domains",
      "Analytical thinking",
    ],
    implementation: [
      "Organize information logically",
      "Use advance organizers",
      "Manage cognitive load",
      "Connect new to prior knowledge",
      "Provide multiple representations",
    ],
  },
  experiential: {
    name: "Experiential Learning",
    description: "Learning through direct experience and reflection on that experience",
    principles: [
      "Experience is the foundation of learning",
      "Reflection transforms experience",
      "Active experimentation is essential",
      "Learning is cyclical",
      "Personal involvement enhances learning",
    ],
    instructionalStrategies: [
      "Hands-on activities",
      "Simulations and role-play",
      "Field experiences",
      "Reflection journals",
      "Action learning projects",
    ],
    assessmentApproach: [
      "Portfolio assessment",
      "Reflection papers",
      "Performance evaluation",
      "Peer feedback",
      "Self-assessment",
    ],
    suitableFor: [
      "Skill development",
      "Professional training",
      "Leadership development",
      "Practical applications",
      "Adult learning",
    ],
    implementation: [
      "Provide concrete experiences",
      "Include reflection opportunities",
      "Encourage experimentation",
      "Connect theory to practice",
      "Support active participation",
    ],
  },
};

// Content Template Generators
export class LearningDesignTemplates {
  static generateLearningObjective(
    title: string,
    bloomLevel: BloomLevel,
    subject: string,
    difficulty: DifficultyLevel = "beginner"
  ): Partial<LearningObjective> {
    const actionVerbs = BLOOM_ACTION_VERBS[bloomLevel];
    const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    
    return {
      title,
      bloomLevel,
      description: `Learners will be able to ${randomVerb} ${subject}`,
      measurableOutcome: `Successfully ${randomVerb} ${subject} with 80% accuracy`,
      assessmentCriteria: [
        `Demonstrates ability to ${randomVerb} ${subject}`,
        "Shows understanding of key concepts",
        "Applies knowledge appropriately",
      ],
      prerequisites: difficulty === "beginner" ? [] : ["Basic understanding of related concepts"],
      estimatedTime: this.getEstimatedTimeByBloom(bloomLevel),
      tags: [bloomLevel, difficulty, subject.toLowerCase()],
    };
  }

  static generateContentBlockTemplate(
    type: ContentType,
    learningStyle: LearningStyle,
    difficulty: DifficultyLevel = "beginner"
  ): Partial<ContentBlock> {
    return {
      type,
      metadata: {
        difficulty,
        learningStyles: [learningStyle],
        interactionLevel: this.getInteractionLevel(type),
      },
      resources: {
        files: [],
        links: [],
        references: [],
      },
    };
  }

  static generateAssessmentTemplate(
    type: AssessmentStrategy["type"],
    bloomLevel: BloomLevel,
    difficulty: DifficultyLevel = "beginner"
  ): Partial<Assessment> {
    const strategy = ASSESSMENT_STRATEGIES[type];
    const methods = strategy.methods;
    
    return {
      type,
      settings: {
        timeLimit: this.getTimeLimit(type, difficulty),
        attempts: type === "formative" ? 3 : 1,
        passingScore: type === "summative" ? 80 : 60,
        randomizeQuestions: true,
        showFeedback: type !== "summative",
        allowReview: type === "formative",
      },
      estimatedTime: this.getAssessmentTime(type, difficulty),
    };
  }

  static generateQuizQuestion(
    bloomLevel: BloomLevel,
    type: AssessmentType = "multiple_choice",
    difficulty: DifficultyLevel = "beginner"
  ): Partial<QuizQuestion> {
    return {
      type,
      bloomLevel,
      difficulty,
      points: this.getPointsByBloom(bloomLevel),
      feedback: {
        correct: "Excellent! You've demonstrated understanding of this concept.",
        incorrect: "Not quite right. Review the material and try again.",
        partial: "You're on the right track, but consider these additional points...",
      },
      tags: [bloomLevel, difficulty, type],
    };
  }

  static generateLessonTemplate(
    subject: string,
    difficulty: DifficultyLevel = "beginner",
    pedagogicalApproach: string = "constructivist"
  ): Partial<Lesson> {
    const approach = PEDAGOGICAL_APPROACHES[pedagogicalApproach];
    
    return {
      difficulty,
      tags: [subject.toLowerCase(), difficulty, pedagogicalApproach],
      metadata: {
        author: "System Generated",
        version: "1.0",
        language: "en",
        lastReviewed: new Date(),
      },
      sequencing: {
        isRequired: true,
        order: 1,
        dependencies: [],
      },
    };
  }

  static generateModuleTemplate(
    subject: string,
    targetAudience: string,
    difficulty: DifficultyLevel = "beginner"
  ): Partial<LearningModule> {
    return {
      difficulty,
      targetAudience,
      subject,
      tags: [subject.toLowerCase(), targetAudience.toLowerCase(), difficulty],
      metadata: {
        author: "System Generated",
        version: "1.0",
        language: "en",
        lastReviewed: new Date(),
      },
      settings: {
        allowNonLinearProgression: difficulty === "advanced",
        requireCompletionOrder: difficulty === "beginner",
        certificateEligible: true,
      },
    };
  }

  static generateCourseTemplate(
    subject: string,
    category: string,
    targetAudience: string,
    difficulty: DifficultyLevel = "beginner"
  ): Partial<Course> {
    return {
      difficulty,
      targetAudience,
      subject,
      category,
      tags: [subject.toLowerCase(), category.toLowerCase(), targetAudience.toLowerCase(), difficulty],
      metadata: {
        author: "System Generated",
        version: "1.0",
        language: "en",
        lastReviewed: new Date(),
        certification: {
          available: true,
          requirements: ["Complete all modules", "Pass final assessment"],
          validityPeriod: 24, // 2 years
        },
      },
      settings: {
        enrollmentOpen: true,
        selfPaced: true,
        allowNonLinearProgression: difficulty === "advanced",
        requireCompletionOrder: difficulty === "beginner",
        discussionEnabled: true,
      },
    };
  }

  // Helper methods
  private static getEstimatedTimeByBloom(bloomLevel: BloomLevel): number {
    const timeMap: Record<BloomLevel, number> = {
      remember: 15,
      understand: 20,
      apply: 30,
      analyze: 45,
      evaluate: 60,
      create: 90,
    };
    return timeMap[bloomLevel];
  }

  private static getInteractionLevel(type: ContentType): "passive" | "active" | "interactive" {
    const interactionMap: Record<ContentType, "passive" | "active" | "interactive"> = {
      text: "passive",
      audio: "passive",
      video: "active",
      image: "passive",
      interactive: "interactive",
      simulation: "interactive",
      quiz: "interactive",
      assignment: "active",
    };
    return interactionMap[type];
  }

  private static getTimeLimit(type: AssessmentStrategy["type"], difficulty: DifficultyLevel): number {
    const baseTime = type === "diagnostic" ? 10 : type === "formative" ? 15 : 60;
    const difficultyMultiplier = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 1.5 : 2;
    return Math.round(baseTime * difficultyMultiplier);
  }

  private static getAssessmentTime(type: AssessmentStrategy["type"], difficulty: DifficultyLevel): number {
    const baseTime = type === "diagnostic" ? 5 : type === "formative" ? 10 : 45;
    const difficultyMultiplier = difficulty === "beginner" ? 1 : difficulty === "intermediate" ? 1.5 : 2;
    return Math.round(baseTime * difficultyMultiplier);
  }

  private static getPointsByBloom(bloomLevel: BloomLevel): number {
    const pointsMap: Record<BloomLevel, number> = {
      remember: 1,
      understand: 2,
      apply: 3,
      analyze: 4,
      evaluate: 5,
      create: 6,
    };
    return pointsMap[bloomLevel];
  }
}

// Quality Assurance Checklist
export interface QualityChecklistItem {
  category: string;
  item: string;
  description: string;
  required: boolean;
}

export const LEARNING_DESIGN_QUALITY_CHECKLIST: QualityChecklistItem[] = [
  // Learning Objectives
  {
    category: "Learning Objectives",
    item: "SMART Objectives",
    description: "Objectives are Specific, Measurable, Achievable, Relevant, and Time-bound",
    required: true,
  },
  {
    category: "Learning Objectives",
    item: "Bloom's Taxonomy Alignment",
    description: "Objectives use appropriate action verbs for the intended cognitive level",
    required: true,
  },
  {
    category: "Learning Objectives",
    item: "Assessment Alignment",
    description: "Assessments directly measure the stated learning objectives",
    required: true,
  },
  
  // Content Design
  {
    category: "Content Design",
    item: "Logical Sequencing",
    description: "Content is organized in a logical, progressive sequence",
    required: true,
  },
  {
    category: "Content Design",
    item: "Cognitive Load Management",
    description: "Information is chunked appropriately to avoid cognitive overload",
    required: true,
  },
  {
    category: "Content Design",
    item: "Multiple Learning Styles",
    description: "Content accommodates different learning style preferences",
    required: false,
  },
  
  // Assessment Design
  {
    category: "Assessment Design",
    item: "Varied Assessment Types",
    description: "Multiple assessment methods are used throughout the course",
    required: false,
  },
  {
    category: "Assessment Design",
    item: "Formative Feedback",
    description: "Regular formative assessments provide learner feedback",
    required: true,
  },
  {
    category: "Assessment Design",
    item: "Clear Rubrics",
    description: "Assessment criteria and rubrics are clearly defined",
    required: true,
  },
  
  // Accessibility
  {
    category: "Accessibility",
    item: "Universal Design",
    description: "Content is designed to be accessible to learners with disabilities",
    required: true,
  },
  {
    category: "Accessibility",
    item: "Alternative Formats",
    description: "Alternative formats are provided for multimedia content",
    required: true,
  },
  
  // Engagement
  {
    category: "Engagement",
    item: "Interactive Elements",
    description: "Course includes interactive elements to engage learners",
    required: false,
  },
  {
    category: "Engagement",
    item: "Real-world Application",
    description: "Content connects to real-world applications and examples",
    required: true,
  },
];

// All templates and frameworks are already exported above



