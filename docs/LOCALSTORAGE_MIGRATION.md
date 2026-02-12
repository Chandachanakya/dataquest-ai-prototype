# LocalStorage Migration Guide

## Issue

After fixing the user progress isolation bug, old shared localStorage data may still exist in your browser, causing progress to appear shared across users.

## Automatic Migration

The system now **automatically migrates** old shared data to user-specific storage when you log in:

1. **On Login**: Old shared keys are migrated to user-specific keys
2. **Old Data Removed**: Shared keys are deleted to prevent conflicts
3. **One-Time Process**: Migration only runs once per browser

## Manual Cleanup (If Needed)

If you're still seeing shared progress, you can manually clear old data:

### Option 1: Clear Browser Console

Open browser console (F12) and run:

```javascript
// Clear ALL old shared course progress
localStorage.removeItem('sql_course_progress');
localStorage.removeItem('ml_course_progress');
localStorage.removeItem('visualization_course_progress');

// Then refresh the page
location.reload();
```

### Option 2: Clear All Site Data

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Local Storage** → Your site URL
4. Right-click → **Clear**
5. Refresh the page

## Verification

After clearing:

1. **Log in as User A**
   - Complete a level in any course
   - Check progress shows correctly

2. **Log out and log in as User B**
   - Progress should be empty (not showing User A's data)
   - Complete a different level
   - Check progress shows correctly

3. **Log back in as User A**
   - Should see only User A's progress
   - User B's progress should NOT appear

## Technical Details

**Old Storage Keys (Shared):**
- `sql_course_progress`
- `ml_course_progress`
- `visualization_course_progress`

**New Storage Keys (User-Specific):**
- `sql_course_progress_<user_id>`
- `ml_course_progress_<user_id>`
- `visualization_course_progress_<user_id>`

**Migration Flag:**
- `course_progress_migration_v1_completed` - Prevents re-running migration

## For Developers

The migration logic is in `src/lib/localStorageMigration.ts`:

```typescript
// Migrate old data to user-specific keys
migrateLocalStorageToUserSpecific(userId);

// Clear user's progress (testing)
clearUserCourseProgress(userId);

// Clear all shared keys (admin)
clearAllSharedCourseProgress();
```

Migration is automatically called in `useAuth.tsx` when:
- User signs in (`SIGNED_IN` event)
- Existing session is detected on page load
