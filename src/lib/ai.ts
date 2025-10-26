// Mock AI personalization engine
// In production, this would use TensorFlow.js or call a real AI API
import { User, Quest } from './types';

export const aiEngine = {
  /**
   * Recommends the next quest based on user preferences and progress
   * Currently uses rule-based logic; could be enhanced with ML model
   */
  recommendNextQuest: (user: User, availableQuests: Quest[], completedQuestIds: string[]): Quest | null => {
    // Filter out completed quests
    const incompleteQuests = availableQuests.filter(q => !completedQuestIds.includes(q.id));
    
    if (incompleteQuests.length === 0) return null;

    // Simple scoring algorithm based on user preferences
    const scoredQuests = incompleteQuests.map(quest => {
      let score = 0;

      // Match difficulty preference
      if (quest.difficulty === user.preferences.difficulty) {
        score += 10;
      } else if (
        (user.preferences.difficulty === 'beginner' && quest.difficulty === 'intermediate') ||
        (user.preferences.difficulty === 'advanced' && quest.difficulty === 'intermediate')
      ) {
        score += 5;
      }

      // Match topic preference
      if (user.preferences.topics.includes(quest.topic)) {
        score += 15;
      }

      // Progressive difficulty based on level
      if (user.level < 5 && quest.difficulty === 'beginner') {
        score += 5;
      } else if (user.level >= 5 && user.level < 10 && quest.difficulty === 'intermediate') {
        score += 5;
      } else if (user.level >= 10 && quest.difficulty === 'advanced') {
        score += 5;
      }

      return { quest, score };
    });

    // Sort by score and return top recommendation
    scoredQuests.sort((a, b) => b.score - a.score);
    return scoredQuests[0].quest;
  },

  /**
   * Analyzes user performance and suggests areas for improvement
   */
  generateInsights: (user: User): string[] => {
    const insights: string[] = [];

    if (user.streak === 0) {
      insights.push("Start a learning streak today! Complete one quest to begin.");
    } else if (user.streak >= 7) {
      insights.push(`Amazing ${user.streak}-day streak! Keep it up! 🔥`);
    }

    if (user.level < 5) {
      insights.push("You're making great progress! Focus on fundamentals to build a strong foundation.");
    } else if (user.level >= 10) {
      insights.push("Expert level! Consider tackling advanced challenges to push your limits.");
    }

    return insights;
  },
};
