import { supabase } from '@/integrations/supabase/client';
import type { Quest } from './types';

// Types
export interface QuestSequence {
    questId: string;
    questTitle: string;
    qValue: number;
    reason: string;
    expectedReward: number;
    difficulty: string;
}

export interface InterventionArm {
    type: 'encouragement' | 'hint' | 'easier_quest' | 'break';
    successes: number;
    failures: number;
    message: string;
    sampledValue?: number;
}

export interface DifficultyRecommendation {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    confidence: number;
    reason: string;
    recentPerformance: {
        successRate: number;
        avgScore: number;
        trend: 'improving' | 'stable' | 'declining';
    };
    successRate: number;
    avgScore: number;
    trend: 'improving' | 'stable' | 'declining';
}


// Helper: Calculate Q-value for a quest
function calculateQValue(
    quest: Quest,
    userSkillLevel: number,
    topicMastery: Map<string, number>,
    recentPerformance: number
): number {
    // Immediate reward: How well does this quest match user's current level?
    const difficultyScore = {
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3
    }[quest.difficulty] || 2;

    const skillMatch = 1 - Math.abs(userSkillLevel - difficultyScore) / 3;
    const immediateReward = skillMatch * 10;

    // Future value: Does this quest help with topic progression?
    const topicValue = topicMastery.get(quest.topic || 'general') || 0;
    const futureValue = (1 - topicValue) * 5; // Higher value for unexplored topics

    // Performance bonus: Reward quests that match recent success pattern
    const performanceBonus = recentPerformance > 0.7 ? 2 : 0;

    return immediateReward + futureValue + performanceBonus;
}

// 1. RL-Based Quest Sequencing
export async function getOptimalQuestSequence(
    userId: string,
    availableQuests: Quest[]
): Promise<QuestSequence[]> {
    try {
        // Get user's recent quest attempts to determine skill level
        const { data: attempts } = await supabase
            .from('quest_attempts')
            .select('quest_id, score, completed_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(10);

        if (!attempts || attempts.length === 0) {
            // New user: recommend beginner quests
            return availableQuests
                .filter(q => q.difficulty === 'beginner')
                .slice(0, 3)
                .map(q => ({
                    questId: q.id,
                    questTitle: q.title,
                    qValue: 10,
                    reason: 'Great starting point for beginners',
                    expectedReward: 10,
                    difficulty: q.difficulty
                }));
        }

        // Calculate user's current skill level (1-3 scale)
        const avgScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length;
        const userSkillLevel = avgScore > 80 ? 3 : avgScore > 60 ? 2 : 1;

        // Calculate topic mastery
        const topicMastery = new Map<string, number>();
        const { data: completedQuests } = await supabase
            .from('user_progress')
            .select('quest_id')
            .eq('user_id', userId)
            .eq('completed', true);

        const completedIds = new Set(completedQuests?.map(q => q.quest_id) || []);

        // Calculate recent performance trend
        const recentScores = attempts.slice(0, 5).map(a => a.score || 0);
        const recentPerformance = recentScores.reduce((a, b) => a + b, 0) / (recentScores.length * 100);

        // Calculate Q-values for each available quest
        const sequences: QuestSequence[] = availableQuests
            .filter(q => !completedIds.has(q.id))
            .map(quest => {
                const qValue = calculateQValue(quest, userSkillLevel, topicMastery, recentPerformance);

                // Epsilon-greedy: 10% exploration
                const explorationBonus = Math.random() < 0.1 ? Math.random() * 5 : 0;
                const finalQValue = qValue + explorationBonus;

                // Generate reason based on Q-value components
                let reason = '';
                const difficultyMatch = quest.difficulty ===
                    (userSkillLevel === 3 ? 'advanced' : userSkillLevel === 2 ? 'intermediate' : 'beginner');

                if (difficultyMatch) {
                    reason = 'Perfect difficulty match for your skill level';
                } else if (recentPerformance > 0.8 && quest.difficulty === 'advanced') {
                    reason = 'Challenge yourself with this advanced quest';
                } else if (recentPerformance < 0.5 && quest.difficulty === 'beginner') {
                    reason = 'Build confidence with this foundational quest';
                } else {
                    reason = 'Recommended for skill progression';
                }

                return {
                    questId: quest.id,
                    questTitle: quest.title,
                    qValue: finalQValue,
                    reason,
                    expectedReward: qValue,
                    difficulty: quest.difficulty
                };
            })
            .sort((a, b) => b.qValue - a.qValue)
            .slice(0, 5);

        return sequences;

    } catch (error) {
        console.error('Error calculating quest sequence:', error);
        return [];
    }
}

// 2. Adaptive Difficulty
export async function getAdaptiveDifficultyLevel(
    userId: string
): Promise<DifficultyRecommendation> {
    try {
        // Get recent quest attempts (last 5)
        const { data: attempts } = await supabase
            .from('quest_attempts')
            .select('score, quest_id, completed_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(5);

        if (!attempts || attempts.length < 3) {
            return {
                level: 'beginner',
                confidence: 0.5,
                reason: 'Not enough data yet. Starting with beginner level.',
                recentPerformance: { successRate: 0, avgScore: 0, trend: 'stable' },
                successRate: 0,
                avgScore: 0,
                trend: 'stable',
            };
        }

        // Calculate metrics
        const scores = attempts.map(a => a.score || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const successRate = scores.filter(s => s >= 60).length / scores.length;

        // Calculate trend (compare first half vs second half)
        const halfPoint = Math.floor(scores.length / 2);
        const olderAvg = scores.slice(0, halfPoint).reduce((a, b) => a + b, 0) / halfPoint;
        const recentAvg = scores.slice(halfPoint).reduce((a, b) => a + b, 0) / (scores.length - halfPoint);
        const trend: 'improving' | 'stable' | 'declining' =
            recentAvg > olderAvg + 5 ? 'improving' :
                recentAvg < olderAvg - 5 ? 'declining' : 'stable';

        // Determine difficulty level
        let level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        let reason: string;
        let confidence: number;

        if (successRate >= 0.8 && avgScore >= 80) {
            level = 'advanced';
            reason = 'Excellent performance! Ready for advanced challenges.';
            confidence = 0.9;
        } else if (successRate >= 0.6 && avgScore >= 60) {
            level = 'intermediate';
            reason = 'Solid performance. Intermediate level is optimal.';
            confidence = 0.8;
        } else if (successRate < 0.4 || avgScore < 50) {
            level = 'beginner';
            reason = 'Focus on fundamentals with beginner quests.';
            confidence = 0.85;
        } else {
            level = 'intermediate';
            reason = 'Balanced performance. Continue with intermediate quests.';
            confidence = 0.7;
        }

        // Adjust based on trend
        if (trend === 'improving' && level === 'beginner') {
            level = 'intermediate';
            reason = 'Improving fast! Moving to intermediate level.';
        } else if (trend === 'declining' && level === 'advanced') {
            level = 'intermediate';
            reason = 'Consolidate skills at intermediate level.';
        }

        return {
            level,
            confidence,
            reason,
            recentPerformance: { successRate, avgScore, trend },
            successRate,
            avgScore,
            trend,
        };

    } catch (error) {
        console.error('Error calculating adaptive difficulty:', error);
        return {
            level: 'intermediate',
            confidence: 0.5,
            reason: 'Error calculating difficulty. Using default.',
            recentPerformance: { successRate: 0, avgScore: 0, trend: 'stable' },
            successRate: 0,
            avgScore: 0,
            trend: 'stable',
        };
    }
}


// 3. Multi-Armed Bandits (Thompson Sampling)
const INTERVENTION_ARMS: InterventionArm[] = [
    {
        type: 'encouragement',
        successes: 1, // Prior: Beta(1,1)
        failures: 1,
        message: '🌟 You\'re doing great! Keep up the momentum!'
    },
    {
        type: 'hint',
        successes: 1,
        failures: 1,
        message: '💡 Tip: Review the lesson materials before attempting the quest.'
    },
    {
        type: 'easier_quest',
        successes: 1,
        failures: 1,
        message: '🎯 Try this easier quest first to build confidence.'
    },
    {
        type: 'break',
        successes: 1,
        failures: 1,
        message: '☕ Take a short break. You\'ll come back refreshed!'
    }
];

export async function selectBestIntervention(
    userId: string,
    learnerState: string
): Promise<InterventionArm> {
    try {
        // Load intervention statistics from database
        const { data: experiments } = await supabase
            .from('intervention_experiments')
            .select('intervention_type, success')
            .eq('user_id', userId)
            .not('success', 'is', null);

        // Update arm statistics based on past experiments
        const armStats = new Map<string, { successes: number; failures: number }>();

        for (const arm of INTERVENTION_ARMS) {
            const userExperiments = experiments?.filter(e => e.intervention_type === arm.type) || [];
            const successes = userExperiments.filter(e => e.success).length + 1; // Prior
            const failures = userExperiments.filter(e => !e.success).length + 1; // Prior

            armStats.set(arm.type, { successes, failures });
        }

        // Thompson Sampling: Sample from Beta distribution for each arm
        const sampledArms = INTERVENTION_ARMS.map(arm => {
            const stats = armStats.get(arm.type) || { successes: 1, failures: 1 };

            // Simple Beta sampling approximation using mean + random variance
            const alpha = stats.successes;
            const beta = stats.failures;
            const mean = alpha / (alpha + beta);
            const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
            const sampledValue = mean + (Math.random() - 0.5) * Math.sqrt(variance) * 2;

            return {
                ...arm,
                successes: stats.successes,
                failures: stats.failures,
                sampledValue: Math.max(0, Math.min(1, sampledValue))
            };
        });

        // Select arm with highest sampled value
        const selectedArm = sampledArms.reduce((best, current) =>
            (current.sampledValue || 0) > (best.sampledValue || 0) ? current : best
        );

        // Log the intervention selection
        await supabase
            .from('intervention_experiments')
            .insert({
                user_id: userId,
                intervention_type: selectedArm.type,
                learner_state: learnerState,
                applied_at: new Date().toISOString()
            });

        return selectedArm;

    } catch (error) {
        console.error('Error selecting intervention:', error);
        return INTERVENTION_ARMS[0]; // Fallback to encouragement
    }
}

// Record intervention outcome
export async function recordInterventionOutcome(
    userId: string,
    interventionType: string,
    success: boolean
): Promise<void> {
    try {
        // Find the most recent intervention of this type
        const { data: experiment } = await supabase
            .from('intervention_experiments')
            .select('id')
            .eq('user_id', userId)
            .eq('intervention_type', interventionType)
            .is('success', null)
            .order('applied_at', { ascending: false })
            .limit(1)
            .single();

        if (experiment) {
            await supabase
                .from('intervention_experiments')
                .update({
                    success,
                    measured_at: new Date().toISOString()
                })
                .eq('id', experiment.id);
        }
    } catch (error) {
        console.error('Error recording intervention outcome:', error);
    }
}
