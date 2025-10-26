// Core type definitions for DataQuestAI

export interface User {
  id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  totalXP: number;
  streak: number;
  badges: string[];
  completedQuests: number;
  preferences: {
    learningStyle: 'visual' | 'hands-on' | 'reading';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topics: string[];
  };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  xpReward: number;
  type: 'quiz' | 'code' | 'game';
  questions?: QuizQuestion[];
  challenge?: CodeChallenge;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CodeChallenge {
  prompt: string;
  starterCode: string;
  testCases: TestCase[];
}

export interface TestCase {
  input?: any;
  expected?: any;
  description?: string;
}

export interface UserProgress {
  questId: string;
  completed: boolean;
  score: number;
  xpEarned: number;
  completedAt?: string;
}
