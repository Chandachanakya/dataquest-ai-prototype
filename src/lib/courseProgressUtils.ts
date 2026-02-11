import { supabase } from "@/integrations/supabase/client";
import {
    pythonModules,
    CourseProgress as PythonProgress
} from "./pythonCourseData";
import {
    sqlModules,
    CourseProgress as SQLProgress,
    SQL_STORAGE_KEY
} from "./sqlCourseData";
import {
    mlModules,
    CourseProgress as MLProgress,
    ML_STORAGE_KEY
} from "./mlCourseData";
import {
    visualizationModules,
    CourseProgress as VizProgress,
    VIZ_STORAGE_KEY
} from "./visualizationCourseData";

export interface CourseProgress {
    currentLevel: number;
    totalXP: number;
    completedModules: number[];
    completedChallenges: string[];
    completedBossFights: number[];
    completedVideos?: number[];
}

export interface CourseInfo {
    id: string;
    totalModules: number;
    completedModules: number;
}

/**
 * Load progress for Python course from Supabase database
 */
export async function loadPythonProgress(userId: string | undefined): Promise<CourseProgress> {
    if (!userId) {
        return {
            currentLevel: 1,
            totalXP: 0,
            completedModules: [],
            completedChallenges: [],
            completedBossFights: [],
            completedVideos: []
        };
    }

    try {
        const { data, error } = await supabase
            .from("user_course_progress")
            .select("module_id, lesson_id, quiz_score, completed_at")
            .eq("user_id", userId)
            .eq("course_id", "python-for-data-science");

        if (error || !data) {
            return {
                currentLevel: 1,
                totalXP: 0,
                completedModules: [],
                completedChallenges: [],
                completedBossFights: [],
                completedVideos: []
            };
        }

        let totalXP = 0;
        const completedModules = new Set<number>();
        const completedBossFights = new Set<number>();
        const completedChallenges = new Set<string>();
        const completedVideos = new Set<number>();

        for (const record of data) {
            const module = pythonModules.find(m => m.id === record.module_id);
            if (module) {
                if (record.lesson_id === 999) { // Boss fight
                    completedBossFights.add(module.id);
                    totalXP += module.bossFight.xpReward;
                    completedModules.add(module.id);
                } else if (record.lesson_id === 998) { // Video watched
                    completedVideos.add(module.id);
                } else {
                    const challenge = module.challenges.find(c => c.id === `${module.id}-${record.lesson_id}`);
                    if (challenge) {
                        completedChallenges.add(challenge.id);
                        totalXP += challenge.xpReward;
                    }
                }
            }
        }

        return {
            currentLevel: completedModules.size > 0 ? Math.max(...Array.from(completedModules)) + 1 : 1,
            totalXP,
            completedModules: Array.from(completedModules),
            completedChallenges: Array.from(completedChallenges),
            completedBossFights: Array.from(completedBossFights),
            completedVideos: Array.from(completedVideos)
        };
    } catch (error) {
        console.error("Error loading Python progress:", error);
        return {
            currentLevel: 1,
            totalXP: 0,
            completedModules: [],
            completedChallenges: [],
            completedBossFights: [],
            completedVideos: []
        };
    }
}

/**
 * Load progress from localStorage for a given storage key
 */
function loadLocalStorageProgress(storageKey: string): CourseProgress {
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error(`Error loading progress from ${storageKey}:`, error);
    }

    return {
        currentLevel: 1,
        totalXP: 0,
        completedModules: [],
        completedChallenges: [],
        completedBossFights: []
    };
}

/**
 * Load progress for SQL course from localStorage
 */
export function loadSQLProgress(): CourseProgress {
    return loadLocalStorageProgress(SQL_STORAGE_KEY);
}

/**
 * Load progress for ML course from localStorage
 */
export function loadMLProgress(): CourseProgress {
    return loadLocalStorageProgress(ML_STORAGE_KEY);
}

/**
 * Load progress for Visualization course from localStorage
 */
export function loadVisualizationProgress(): CourseProgress {
    return loadLocalStorageProgress(VIZ_STORAGE_KEY);
}

/**
 * Calculate the number of completed modules based on completed boss fights
 */
export function calculateCompletedModules(progress: CourseProgress): number {
    return progress.completedBossFights.length;
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

/**
 * Load all course progress information
 */
export async function loadAllCourseProgress(userId: string | undefined): Promise<{
    python: CourseInfo;
    ml: CourseInfo;
    visualization: CourseInfo;
    sql: CourseInfo;
}> {
    // Load progress for all courses
    const pythonProgress = await loadPythonProgress(userId);
    const sqlProgress = loadSQLProgress();
    const mlProgress = loadMLProgress();
    const vizProgress = loadVisualizationProgress();

    return {
        python: {
            id: 'python',
            totalModules: pythonModules.length,
            completedModules: calculateCompletedModules(pythonProgress)
        },
        ml: {
            id: 'ml',
            totalModules: mlModules.length,
            completedModules: calculateCompletedModules(mlProgress)
        },
        visualization: {
            id: 'visualization',
            totalModules: visualizationModules.length,
            completedModules: calculateCompletedModules(vizProgress)
        },
        sql: {
            id: 'sql',
            totalModules: sqlModules.length,
            completedModules: calculateCompletedModules(sqlProgress)
        }
    };
}
