/**
 * Experiment Service
 * 
 * Handles A/B testing infrastructure:
 * - User assignment to experiment groups
 * - Metrics tracking
 * - Experiment results retrieval
 */

import { supabase } from '@/integrations/supabase/client';

export type ExperimentGroup = 'control' | 'treatment';

/**
 * Hash function for deterministic user assignment
 * Same user always gets same group (stable across sessions)
 */
function hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Deterministically assign user to experiment group
 * Uses hash-based assignment for 50/50 split
 */
function determineExperimentGroup(userId: string): ExperimentGroup {
    const hash = hashUserId(userId);
    return hash % 2 === 0 ? 'control' : 'treatment';
}

/**
 * Assign user to experiment group (if not already assigned)
 * Returns the assigned group
 */
export async function assignUserToExperiment(
    userId: string,
    experimentName: string = 'ml_vs_heuristic'
): Promise<ExperimentGroup> {
    // Check if user is already assigned
    const { data: existing } = await supabase
        .from('experiment_groups')
        .select('group_name')
        .eq('user_id', userId)
        .eq('experiment_name', experimentName)
        .single();

    if (existing) {
        return existing.group_name as ExperimentGroup;
    }

    // Deterministically assign to group
    const groupName = determineExperimentGroup(userId);

    // Insert assignment
    const { error } = await supabase
        .from('experiment_groups')
        .insert({
            user_id: userId,
            experiment_name: experimentName,
            group_name: groupName,
            metadata: {
                assigned_by: 'auto',
                hash_value: hashUserId(userId)
            }
        });

    if (error) {
        console.error('Error assigning user to experiment:', error);
        // Return deterministic group even if insert fails
        return groupName;
    }

    console.log(`✅ User ${userId} assigned to ${groupName} group for ${experimentName}`);
    return groupName;
}

/**
 * Get user's experiment group (assigns if not already assigned)
 */
export async function getUserExperimentGroup(
    userId: string,
    experimentName: string = 'ml_vs_heuristic'
): Promise<ExperimentGroup> {
    // Try to get existing assignment
    const { data } = await supabase
        .from('experiment_groups')
        .select('group_name')
        .eq('user_id', userId)
        .eq('experiment_name', experimentName)
        .single();

    if (data) {
        return data.group_name as ExperimentGroup;
    }

    // No assignment yet - assign now
    return await assignUserToExperiment(userId, experimentName);
}

/**
 * Track experiment metric
 */
export async function trackExperimentMetric(
    userId: string,
    metricName: string,
    metricValue: number,
    experimentName: string = 'ml_vs_heuristic',
    metadata: Record<string, any> = {}
): Promise<void> {
    const { error } = await supabase
        .from('experiment_metrics')
        .insert({
            user_id: userId,
            experiment_name: experimentName,
            metric_name: metricName,
            metric_value: metricValue,
            metadata
        });

    if (error) {
        console.error('Error tracking experiment metric:', error);
    }
}

/**
 * Get experiment results (aggregated by group)
 */
export async function getExperimentResults(
    experimentName: string = 'ml_vs_heuristic'
): Promise<{
    control: Record<string, number>;
    treatment: Record<string, number>;
}> {
    // Get all metrics
    const { data: metrics } = await supabase
        .from('experiment_metrics')
        .select('user_id, metric_name, metric_value')
        .eq('experiment_name', experimentName);

    if (!metrics) {
        return { control: {}, treatment: {} };
    }

    // Get user group assignments
    const { data: groups } = await supabase
        .from('experiment_groups')
        .select('user_id, group_name')
        .eq('experiment_name', experimentName);

    if (!groups) {
        return { control: {}, treatment: {} };
    }

    // Create user -> group map
    const userGroupMap = new Map<string, ExperimentGroup>();
    groups.forEach(g => {
        userGroupMap.set(g.user_id, g.group_name as ExperimentGroup);
    });

    // Aggregate metrics by group
    const controlMetrics: Record<string, number[]> = {};
    const treatmentMetrics: Record<string, number[]> = {};

    metrics.forEach(m => {
        const group = userGroupMap.get(m.user_id);
        if (!group) return;

        const targetMap = group === 'control' ? controlMetrics : treatmentMetrics;
        if (!targetMap[m.metric_name]) {
            targetMap[m.metric_name] = [];
        }
        targetMap[m.metric_name].push(m.metric_value);
    });

    // Calculate averages
    const avgControl: Record<string, number> = {};
    const avgTreatment: Record<string, number> = {};

    Object.entries(controlMetrics).forEach(([metric, values]) => {
        avgControl[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    Object.entries(treatmentMetrics).forEach(([metric, values]) => {
        avgTreatment[metric] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return {
        control: avgControl,
        treatment: avgTreatment
    };
}

/**
 * Get experiment group distribution
 */
export async function getExperimentDistribution(
    experimentName: string = 'ml_vs_heuristic'
): Promise<{
    control: number;
    treatment: number;
    total: number;
}> {
    const { data } = await supabase
        .from('experiment_groups')
        .select('group_name')
        .eq('experiment_name', experimentName);

    if (!data) {
        return { control: 0, treatment: 0, total: 0 };
    }

    const control = data.filter(g => g.group_name === 'control').length;
    const treatment = data.filter(g => g.group_name === 'treatment').length;

    return {
        control,
        treatment,
        total: data.length
    };
}

/**
 * Check if user should use ML API based on experiment assignment
 * Returns true if user is in treatment group, false if control
 * Returns null if not in experiment (use env var setting)
 */
export async function shouldUseMlApi(userId: string): Promise<boolean | null> {
    const group = await getUserExperimentGroup(userId);

    if (group === 'treatment') {
        return true; // Force ML API
    } else if (group === 'control') {
        return false; // Force heuristics
    }

    return null; // Not in experiment
}
