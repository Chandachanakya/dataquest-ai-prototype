// Local storage utilities for DataQuestAI
import { User, UserProgress } from './types';

const STORAGE_KEYS = {
  CURRENT_USER: 'dataquestai_current_user',
  USER_PROGRESS: 'dataquestai_user_progress',
  ONBOARDING_COMPLETE: 'dataquestai_onboarding',
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
};
