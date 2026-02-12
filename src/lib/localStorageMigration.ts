/**
 * Migration utility to clean up old shared localStorage data
 * and ensure user-specific storage is used
 */

import { SQL_STORAGE_KEY } from './sqlCourseData';
import { ML_STORAGE_KEY } from './mlCourseData';
import { VIZ_STORAGE_KEY } from './visualizationCourseData';

const MIGRATION_FLAG = 'course_progress_migration_v1_completed';

/**
 * Migrate old shared localStorage to user-specific storage
 * This should be called once when the user logs in
 */
export function migrateLocalStorageToUserSpecific(userId: string) {
    // Check if migration already completed for this browser
    const migrationCompleted = localStorage.getItem(MIGRATION_FLAG);
    if (migrationCompleted === 'true') {
        return;
    }

    console.log('🔄 Migrating localStorage to user-specific keys...');

    const keysToMigrate = [
        SQL_STORAGE_KEY,
        ML_STORAGE_KEY,
        VIZ_STORAGE_KEY
    ];

    for (const oldKey of keysToMigrate) {
        const oldData = localStorage.getItem(oldKey);
        if (oldData) {
            // Check if user-specific key already exists
            const newKey = `${oldKey}_${userId}`;
            const existingUserData = localStorage.getItem(newKey);

            if (!existingUserData) {
                // Migrate old data to user-specific key
                console.log(`  ✅ Migrating ${oldKey} → ${newKey}`);
                localStorage.setItem(newKey, oldData);
            } else {
                console.log(`  ⏭️  User-specific data already exists for ${newKey}`);
            }

            // Remove old shared key
            console.log(`  🗑️  Removing old shared key: ${oldKey}`);
            localStorage.removeItem(oldKey);
        }
    }

    // Mark migration as completed
    localStorage.setItem(MIGRATION_FLAG, 'true');
    console.log('✅ Migration completed!');
}

/**
 * Clear all course progress for the current user
 * Useful for testing or resetting progress
 */
export function clearUserCourseProgress(userId: string) {
    const userKeys = [
        `${SQL_STORAGE_KEY}_${userId}`,
        `${ML_STORAGE_KEY}_${userId}`,
        `${VIZ_STORAGE_KEY}_${userId}`
    ];

    for (const key of userKeys) {
        localStorage.removeItem(key);
        console.log(`🗑️  Cleared: ${key}`);
    }
}

/**
 * Clear ALL old shared localStorage keys (admin/debug only)
 * This removes any remaining shared data that might cause issues
 */
export function clearAllSharedCourseProgress() {
    const sharedKeys = [
        SQL_STORAGE_KEY,
        ML_STORAGE_KEY,
        VIZ_STORAGE_KEY
    ];

    for (const key of sharedKeys) {
        localStorage.removeItem(key);
        console.log(`🗑️  Cleared shared key: ${key}`);
    }
}
