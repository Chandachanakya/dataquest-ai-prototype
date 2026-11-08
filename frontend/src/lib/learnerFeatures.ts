/**
 * Authoritative client-side implementation of the ten model features.
 * It has no database dependency so validation can execute this exact code.
 */
/** Median positive completion_time in the deterministic training corpus. */
export const DATASET_MEDIAN_TIME = 576.0;
export const DIFFICULTY_NUMERIC_MAP: Record<string, number> = {
  beginner: 1, intermediate: 2, advanced: 4, expert: 6,
};

export interface FeatureAttempt {
  quest_id: string;
  score: number | null;
  completion_time: number | null;
  status: string | null;
  started_at: string;
  difficulty?: number | null;
}

export interface MLFeatures {
  days_since_last_active: number; activity_frequency: number; average_score: number;
  total_attempts: number; completion_time_vs_median: number; retry_ratio: number;
  score_variance: number; recent_xp_velocity: number; completion_rate: number;
  avg_difficulty: number;
}

export type TimestampedFeatureAttempt = FeatureAttempt & { timestamp: number };

/**
 * The single eligibility rule for lifetime learner data. Records without a
 * parseable timestamp, or dated after the evaluation time, are not evidence
 * about the learner and must not influence features or UI metrics.
 */
export function filterAttemptsAtReferenceTime(
  attempts: FeatureAttempt[],
  referenceTime: string | Date = new Date(),
): TimestampedFeatureAttempt[] {
  const referenceTimestamp = new Date(referenceTime).getTime();
  if (!Number.isFinite(referenceTimestamp)) return [];
  return attempts
    .map(attempt => ({ ...attempt, timestamp: new Date(attempt.started_at).getTime() }))
    .filter(attempt => Number.isFinite(attempt.timestamp) && attempt.timestamp <= referenceTimestamp);
}

/** Cold start is a lifecycle state: only zero lifetime attempts is new. */
export const isNewLearner = (totalAttempts: number): boolean => totalAttempts === 0;

const round = (n: number, places: number) => Number(n.toFixed(places));
const finite = (value: unknown, fallback: number) => {
  const n = Number(value); return Number.isFinite(n) ? n : fallback;
};

/** Lifetime features, evaluated at `referenceTime` (not browser wall clock in tests). */
export function calculateFeatureVector(attempts: FeatureAttempt[], referenceTime: string | Date = new Date()): MLFeatures {
  const ref = new Date(referenceTime).getTime();
  const safe = filterAttemptsAtReferenceTime(attempts, referenceTime);
  if (!safe.length) return { days_since_last_active: 30, activity_frequency: 0, average_score: 0,
    total_attempts: 0, completion_time_vs_median: 1, retry_ratio: 1, score_variance: 0,
    recent_xp_velocity: 0, completion_rate: 0, avg_difficulty: 1 };

  const scores = safe.map(a => finite(a.score, 0));
  const difficulties = safe.map(a => Math.min(6, Math.max(1, finite(a.difficulty, 1))));
  const latest = Math.max(...safe.map(a => a.timestamp));
  const thirtyDays = ref - 30 * 86400000;
  const sevenDays = ref - 7 * 86400000;
  const activeDates = new Set(safe.filter(a => a.timestamp >= thirtyDays)
    .map(a => new Date(a.timestamp).toISOString().slice(0, 10)));
  const total = safe.length;
  const rawMean = scores.reduce((s, x) => s + x, 0) / total;
  const completed = safe.filter(a => a.status === 'completed');
  const completedTimes = completed.map(a => finite(a.completion_time, 0)).filter(t => t > 0);
  const meanCompletedTime = completedTimes.length ? completedTimes.reduce((s, x) => s + x, 0) / completedTimes.length : DATASET_MEDIAN_TIME;
  const uniqueQuests = new Set(safe.map(a => a.quest_id)).size;
  const variance = total > 1 ? Math.sqrt(scores.reduce((s, x) => s + (x - rawMean) ** 2, 0) / (total - 1)) : 0;
  const recentScore = safe.filter(a => a.timestamp >= sevenDays).reduce((s, a) => s + finite(a.score, 0), 0);
  return {
    days_since_last_active: round(Math.max(0, (ref - latest) / 86400000), 2),
    activity_frequency: activeDates.size,
    average_score: round(scores.reduce((s, x, i) => s + x / (difficulties[i] * 10) * 100, 0) / total, 2),
    total_attempts: total,
    completion_time_vs_median: round(meanCompletedTime / DATASET_MEDIAN_TIME, 4),
    retry_ratio: round(uniqueQuests ? total / uniqueQuests : 1, 4),
    score_variance: round(variance, 2),
    recent_xp_velocity: round(recentScore / 7, 4),
    completion_rate: round(completed.length / total, 4),
    avg_difficulty: round(difficulties.reduce((s, x) => s + x, 0) / total, 2),
  };
}
