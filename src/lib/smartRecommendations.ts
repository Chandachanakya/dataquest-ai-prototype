import { supabase } from '@/integrations/supabase/client';

// Types
export interface QuestRecommendation {
    questId: string;
    questTitle: string;
    difficulty: string;
    score: number;
    reason: string;
    successRate: number;
    estimatedTime: number;
}

export interface DropRiskAnalysis {
    riskScore: number; // 0-1
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: {
        inactivity: number;
        declining: number;
        incomplete: number;
        engagement: number;
    };
    recommendations: string[];
}

export interface SimilarUser {
    userId: string;
    similarity: number;
    completedQuests: string[];
    avgScore: number;
}

// Helper: Calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper: Get all unique quest IDs from the database
async function getAllQuestIds(): Promise<string[]> {
    const { data } = await supabase
        .from('quest_attempts')
        .select('quest_id');

    if (!data) return [];
    return [...new Set(data.map(a => a.quest_id))];
}

// Helper: Create quest completion vector for a user
async function getUserQuestVector(userId: string, allQuestIds: string[]): Promise<number[]> {
    const { data } = await supabase
        .from('quest_attempts')
        .select('quest_id, score')
        .eq('user_id', userId)
        .eq('status', 'completed');

    if (!data) return new Array(allQuestIds.length).fill(0);

    const questScores = new Map(data.map(a => [a.quest_id, a.score || 0]));
    return allQuestIds.map(qid => questScores.get(qid) || 0);
}

// Find users similar to the current user
async function findSimilarUsers(userId: string, limit: number = 10): Promise<SimilarUser[]> {
    // Get all quest IDs to create vectors
    const allQuestIds = await getAllQuestIds();
    if (allQuestIds.length === 0) return [];

    // Get current user's vector
    const userVector = await getUserQuestVector(userId, allQuestIds);

    // Get all other users
    const { data: allUsers } = await supabase
        .from('quest_attempts')
        .select('user_id')
        .neq('user_id', userId);

    if (!allUsers) return [];
    const uniqueUserIds = [...new Set(allUsers.map(u => u.user_id))];

    // Calculate similarity for each user
    const similarities: SimilarUser[] = [];

    for (const otherUserId of uniqueUserIds) {
        const otherVector = await getUserQuestVector(otherUserId, allQuestIds);
        const similarity = cosineSimilarity(userVector, otherVector);

        if (similarity > 0.1) { // Only include users with some similarity
            const { data: attempts } = await supabase
                .from('quest_attempts')
                .select('quest_id, score')
                .eq('user_id', otherUserId)
                .eq('status', 'completed');

            const completedQuests = attempts?.map(a => a.quest_id) || [];
            const avgScore = attempts?.reduce((sum, a) => sum + (a.score || 0), 0) / (attempts?.length || 1) || 0;

            similarities.push({
                userId: otherUserId,
                similarity,
                completedQuests,
                avgScore
            });
        }
    }

    // Sort by similarity and return top N
    return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}

// Get smart quest recommendations using collaborative filtering
export async function getSmartRecommendations(userId: string): Promise<QuestRecommendation[]> {
    try {
        // Get user's completed quests
        const { data: userQuests } = await supabase
            .from('quest_attempts')
            .select('quest_id')
            .eq('user_id', userId)
            .eq('status', 'completed');

        const completedQuestIds = new Set(userQuests?.map(q => q.quest_id) || []);

        // Find similar users
        const similarUsers = await findSimilarUsers(userId, 5);

        if (similarUsers.length === 0) {
            // No similar users, return popular quests
            return getPopularQuests(userId, completedQuestIds);
        }

        // Aggregate quest recommendations from similar users
        const questScores = new Map<string, { score: number; count: number; totalScore: number }>();

        for (const similarUser of similarUsers) {
            for (const questId of similarUser.completedQuests) {
                if (!completedQuestIds.has(questId)) {
                    const current = questScores.get(questId) || { score: 0, count: 0, totalScore: 0 };
                    questScores.set(questId, {
                        score: current.score + similarUser.similarity,
                        count: current.count + 1,
                        totalScore: current.totalScore + similarUser.avgScore
                    });
                }
            }
        }

        // Get quest details and create recommendations
        const recommendations: QuestRecommendation[] = [];

        for (const [questId, data] of questScores.entries()) {
            const { data: questData } = await supabase
                .from('quests')
                .select('title, difficulty')
                .eq('id', questId)
                .single();

            if (questData) {
                const successRate = data.totalScore / data.count;
                recommendations.push({
                    questId,
                    questTitle: questData.title || questId,
                    difficulty: questData.difficulty || 'intermediate',
                    score: data.score,
                    reason: `${data.count} similar learner${data.count > 1 ? 's' : ''} enjoyed this`,
                    successRate,
                    estimatedTime: 180 // Default 3 minutes
                });
            }
        }

        // Sort by score and return top 5
        return recommendations
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

    } catch (error) {
        console.error('Error getting smart recommendations:', error);
        return [];
    }
}

// Fallback: Get popular quests when no similar users found
async function getPopularQuests(userId: string, completedQuestIds: Set<string>): Promise<QuestRecommendation[]> {
    const { data } = await supabase
        .from('quest_attempts')
        .select('quest_id, score')
        .eq('status', 'completed');

    if (!data) return [];

    // Count completions and average scores
    const questStats = new Map<string, { count: number; totalScore: number }>();

    for (const attempt of data) {
        if (!completedQuestIds.has(attempt.quest_id)) {
            const current = questStats.get(attempt.quest_id) || { count: 0, totalScore: 0 };
            questStats.set(attempt.quest_id, {
                count: current.count + 1,
                totalScore: current.totalScore + (attempt.score || 0)
            });
        }
    }

    // Create recommendations
    const recommendations: QuestRecommendation[] = [];

    for (const [questId, stats] of questStats.entries()) {
        const { data: questData } = await supabase
            .from('quests')
            .select('title, difficulty')
            .eq('id', questId)
            .single();

        if (questData && stats.count >= 3) {
            recommendations.push({
                questId,
                questTitle: questData.title || questId,
                difficulty: questData.difficulty || 'intermediate',
                score: stats.count,
                reason: `Popular choice (${stats.count} completions)`,
                successRate: stats.totalScore / stats.count,
                estimatedTime: 180
            });
        }
    }

    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

// Calculate drop risk score with weighted factors
export async function calculateDropRiskScore(userId: string): Promise<DropRiskAnalysis> {
    try {
        // Get user's recent activity
        const { data: attempts } = await supabase
            .from('quest_attempts')
            .select('completed_at, score, status, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!attempts || attempts.length === 0) {
            return {
                riskScore: 0.5,
                riskLevel: 'MEDIUM',
                factors: { inactivity: 0.5, declining: 0, incomplete: 0, engagement: 0.5 },
                recommendations: ['Start with a beginner quest to get back on track']
            };
        }

        // Factor 1: Inactivity (days since last activity)
        const lastActivity = new Date(attempts[0].completed_at || attempts[0].created_at);
        const daysSinceActive = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        const inactivityScore = Math.min(1, daysSinceActive / 14); // 14 days = max risk

        // Factor 2: Declining performance (negative score trend)
        const recentScores = attempts
            .filter(a => a.status === 'completed' && a.score !== null)
            .slice(0, 10)
            .map(a => a.score || 0);

        let decliningScore = 0;
        if (recentScores.length >= 3) {
            const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
            const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
            const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

            if (avgSecond < avgFirst) {
                decliningScore = Math.min(1, (avgFirst - avgSecond) / 50); // 50 point drop = max risk
            }
        }

        // Factor 3: Incomplete quests
        const incompleteCount = attempts.filter(a => a.status !== 'completed').length;
        const incompleteScore = Math.min(1, incompleteCount / attempts.length);

        // Factor 4: Engagement (XP velocity)
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

        const totalXP = profile?.total_xp || 0;
        const engagementScore = 1 - Math.min(1, totalXP / 500); // 500 XP = low risk

        // Weighted combination
        const weights = {
            inactivity: 0.4,
            declining: 0.3,
            incomplete: 0.2,
            engagement: 0.1
        };

        const riskScore =
            weights.inactivity * inactivityScore +
            weights.declining * decliningScore +
            weights.incomplete * incompleteScore +
            weights.engagement * engagementScore;

        // Determine risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        if (riskScore < 0.3) riskLevel = 'LOW';
        else if (riskScore < 0.7) riskLevel = 'MEDIUM';
        else riskLevel = 'HIGH';

        // Generate recommendations
        const recommendations: string[] = [];
        if (inactivityScore > 0.5) recommendations.push('Try a quick 5-minute quest to rebuild momentum');
        if (decliningScore > 0.3) recommendations.push('Review previous lessons to strengthen fundamentals');
        if (incompleteScore > 0.3) recommendations.push('Focus on completing started quests before starting new ones');
        if (engagementScore > 0.5) recommendations.push('Set a daily learning goal to build consistency');

        return {
            riskScore,
            riskLevel,
            factors: {
                inactivity: inactivityScore,
                declining: decliningScore,
                incomplete: incompleteScore,
                engagement: engagementScore
            },
            recommendations
        };

    } catch (error) {
        console.error('Error calculating drop risk:', error);
        return {
            riskScore: 0,
            riskLevel: 'LOW',
            factors: { inactivity: 0, declining: 0, incomplete: 0, engagement: 0 },
            recommendations: []
        };
    }
}
