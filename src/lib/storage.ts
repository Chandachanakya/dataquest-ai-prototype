// Local storage utilities for DataQuestAI
import { User, UserProgress, ForumPost, Challenge, Achievement, DailyChallenge } from './types';

const STORAGE_KEYS = {
  CURRENT_USER: 'dataquestai_current_user',
  USER_PROGRESS: 'dataquestai_user_progress',
  ONBOARDING_COMPLETE: 'dataquestai_onboarding',
  FORUM_POSTS: 'dataquestai_forum_posts',
  CHALLENGES: 'dataquestai_challenges',
  ACHIEVEMENTS: 'dataquestai_achievements',
  DAILY_CHALLENGES: 'dataquestai_daily_challenges',
};

export const storage = {
  // User management
  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: User): void => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser: (): void => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Onboarding
  isOnboardingComplete: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  },

  setOnboardingComplete: (): void => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  },

  // User progress
  getUserProgress: (): UserProgress[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    return data ? JSON.parse(data) : [];
  },

  saveQuestProgress: (progress: UserProgress): void => {
    const allProgress = storage.getUserProgress();
    const existingIndex = allProgress.findIndex(p => p.questId === progress.questId);
    
    if (existingIndex >= 0) {
      allProgress[existingIndex] = progress;
    } else {
      allProgress.push(progress);
    }
    
    localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(allProgress));
  },

  getQuestProgress: (questId: string): UserProgress | null => {
    const allProgress = storage.getUserProgress();
    return allProgress.find(p => p.questId === questId) || null;
  },

  // Forum posts
  getForumPosts: (): ForumPost[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FORUM_POSTS);
    return data ? JSON.parse(data) : [];
  },

  saveForumPost: (post: ForumPost): void => {
    const posts = storage.getForumPosts();
    posts.unshift(post);
    localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, JSON.stringify(posts));
  },

  updateForumPost: (postId: string, updates: Partial<ForumPost>): void => {
    const posts = storage.getForumPosts();
    const index = posts.findIndex(p => p.id === postId);
    if (index >= 0) {
      posts[index] = { ...posts[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.FORUM_POSTS, JSON.stringify(posts));
    }
  },

  // Challenges
  getChallenges: (): Challenge[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    return data ? JSON.parse(data) : [];
  },

  saveChallenge: (challenge: Challenge): void => {
    const challenges = storage.getChallenges();
    challenges.unshift(challenge);
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  },

  updateChallenge: (challengeId: string, updates: Partial<Challenge>): void => {
    const challenges = storage.getChallenges();
    const index = challenges.findIndex(c => c.id === challengeId);
    if (index >= 0) {
      challenges[index] = { ...challenges[index], ...updates };
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    }
  },

  // Achievements
  getAchievements: (): Achievement[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return data ? JSON.parse(data) : [];
  },

  saveAchievement: (achievement: Achievement): void => {
    const achievements = storage.getAchievements();
    const existing = achievements.findIndex(a => a.id === achievement.id);
    if (existing >= 0) {
      achievements[existing] = achievement;
    } else {
      achievements.push(achievement);
    }
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  },

  // Daily challenges
  getDailyChallenge: (): DailyChallenge | null => {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGES);
    if (!data) return null;
    const challenge = JSON.parse(data);
    // Check if it's still today's challenge
    const today = new Date().toDateString();
    if (challenge.date === today) return challenge;
    return null;
  },

  saveDailyChallenge: (challenge: DailyChallenge): void => {
    localStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, JSON.stringify(challenge));
  },
};
