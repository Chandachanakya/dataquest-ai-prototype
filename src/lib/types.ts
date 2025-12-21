
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
  attempts?: number;
  timeSpent?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface ForumPost {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  title: string;
  content: string;
  topic: string;
  likes: number;
  replies: ForumReply[];
  createdAt: string;
}

export interface ForumReply {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  questId: string;
  creatorId: string;
  creatorName: string;
  targetScore: number;
  participants: ChallengeParticipant[];
  expiresAt: string;
  createdAt: string;
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  avatar: string;
  score?: number;
  completedAt?: string;
}

export interface DailyChallenge {
  id: string;
  questId: string;
  date: string;
  bonusXP: number;
}

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}
