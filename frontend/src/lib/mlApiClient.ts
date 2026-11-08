/**
 * ML API Client
 * 
 * Handles communication with the FastAPI ML microservice.
 * Provides graceful fallback to heuristic logic if API is unavailable.
 */

import { ML_API_URL, USE_ML_API } from "@/api/config";
import type { MLFeatures } from "./learnerEngine";

// Types matching API responses
export interface MLDropRiskResponse {
    user_id: string;
    probability: number;
    risk_level: 'low' | 'medium' | 'high';
    model_version: string;
    timestamp: string;
    features_used: Record<string, number>;
}

export interface MLInterventionResponse {
    user_id: string;
    intervention_type: string;
    expected_reward: number;
    confidence: number;
    reason: string;
    model_version: string;
    timestamp: string;
}

export interface MLNextQuestResponse {
    user_id: string;
    quest_id: string;
    expected_reward: number;
    reason: string;
    model_version: string;
    timestamp: string;
}

/**
 * Predict drop risk using ML API
 */
export async function predictDropRisk(
    userId: string,
    features: MLFeatures | Record<string, number>
): Promise<MLDropRiskResponse | null> {
    if (!USE_ML_API) {
        return null; // Fallback to heuristics
    }

    try {
        const response = await fetch(`${ML_API_URL}/predict/drop-risk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                features: features
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            console.warn('ML API drop risk prediction failed:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('✅ ML API drop risk prediction:', data);
        return data;
    } catch (error) {
        console.warn('ML API unavailable, falling back to heuristics:', error);
        return null;
    }
}

/**
 * Get intervention recommendation using ML API
 */
export async function predictIntervention(
    userId: string,
    context: {
        learner_state_distribution: Record<string, number>;
        recent_performance: number;
        fatigue_score: number;
    }
): Promise<MLInterventionResponse | null> {
    if (!USE_ML_API) {
        return null; // Fallback to heuristics
    }

    try {
        const response = await fetch(`${ML_API_URL}/predict/intervention`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                context: context
            }),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            console.warn('ML API intervention prediction failed:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('✅ ML API intervention prediction:', data);
        return data;
    } catch (error) {
        console.warn('ML API unavailable, falling back to heuristics:', error);
        return null;
    }
}

/**
 * Get next quest recommendation using ML API
 */
export async function predictNextQuest(
    userId: string,
    availableQuests: any[],
    userState: Record<string, any>
): Promise<MLNextQuestResponse | null> {
    if (!USE_ML_API) {
        return null; // Fallback to heuristics
    }

    try {
        const response = await fetch(`${ML_API_URL}/predict/next-quest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                available_quests: availableQuests,
                user_state: userState
            }),
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            console.warn('ML API next quest prediction failed:', response.statusText);
            return null;
        }

        const data = await response.json();
        console.log('✅ ML API next quest prediction:', data);
        return data;
    } catch (error) {
        console.warn('ML API unavailable, falling back to heuristics:', error);
        return null;
    }
}

/**
 * Check if ML API is enabled and available
 */
export async function checkMLApiHealth(): Promise<boolean> {
    if (!USE_ML_API) {
        return false;
    }

    try {
        const response = await fetch(`${ML_API_URL}/`, {
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

/**
 * Get ML API status for debugging
 */
export function getMLApiStatus(): {
    enabled: boolean;
    url: string;
} {
    return {
        enabled: USE_ML_API,
        url: ML_API_URL
    };
}
