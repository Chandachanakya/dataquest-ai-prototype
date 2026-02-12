# Manual Testing Guide - Step by Step

## 🚀 Setup Complete

✅ **ML API is running** on http://localhost:8000
✅ **Frontend is running** on http://localhost:8080

---

## 📋 Test 1: Clear Old LocalStorage (REQUIRED FIRST)

**Before testing anything, you MUST clear old shared data:**

1. **Open your application** in browser: http://localhost:8080
2. **Open browser console** (Press F12)
3. **Run this code** in the console:

```javascript
// Clear old shared localStorage keys
localStorage.removeItem('sql_course_progress');
localStorage.removeItem('ml_course_progress');
localStorage.removeItem('visualization_course_progress');

// Verify they're gone
console.log('Old keys cleared!');

// Reload the page
location.reload();
```

4. **Expected Result:** Page reloads, console shows "Old keys cleared!"

---

## 📋 Test 2: User Progress Isolation

### Part A: User A - Complete a Level

1. **Log in as User A** (your main account)
   
2. **Check console for migration message:**
   - Should see: `🔄 Migrating localStorage to user-specific keys...`
   - Should see: `✅ Migration completed!`

3. **Go to SQL Course** (/courses/sql)
   
4. **Check XP Display:**
   - Should show: "Total XP: 0"
   - Should show: "Levels Complete: 0"

5. **Complete Level 1:**
   - Click on Level 1 module
   - Complete challenges
   - Defeat boss

6. **Verify Progress:**
   - XP should increase
   - "Levels Complete" should show: 1
   - Console should show: `Using heuristic learner state determination (control group)` OR `✅ ML API drop risk prediction` (treatment group)

7. **Check localStorage in console:**
```javascript
// Check user-specific key exists
const userId = 'YOUR_USER_ID'; // Replace with actual user ID from console
console.log('SQL Progress:', localStorage.getItem(`sql_course_progress_${userId}`));
```

### Part B: User B - Verify Isolation

8. **Log out** (click profile → sign out)

9. **Create/Log in as User B** (different account)

10. **Check console for migration:**
    - Should see migration message again (for User B)

11. **Go to SQL Course** (/courses/sql)

12. **CRITICAL CHECK - Verify Progress is EMPTY:**
    - Total XP should be: **0** (NOT User A's XP)
    - Levels Complete should be: **0** (NOT showing User A's level)
    - ✅ **PASS** if progress is empty
    - ❌ **FAIL** if you see User A's progress

13. **Complete Level 2:**
    - Click on Level 2 module
    - Complete challenges
    - Defeat boss

14. **Verify User B's Progress:**
    - Levels Complete: 1 (Level 2)
    - Should NOT show Level 1 as completed

### Part C: User A Returns

15. **Log out** (User B)

16. **Log in as User A** again

17. **Go to SQL Course**

18. **CRITICAL CHECK - Verify User A's Original Progress:**
    - Should show Level 1 completed ✅
    - Should NOT show Level 2 completed ❌
    - ✅ **PASS** if only Level 1 is completed
    - ❌ **FAIL** if you see Level 2 or no progress

---

## 📋 Test 3: Course Progress Bars

1. **While logged in as User A**, go to **/courses**

2. **Check SQL Course Card:**
   - Progress bar should show: 1/5 levels (20%)
   - Should match what you completed as User A

3. **Log out and log in as User B**

4. **Go to /courses**

5. **Check SQL Course Card:**
   - Progress bar should show: 1/5 levels (20%)
   - Should show Level 2 completion (User B's progress)
   - Should NOT show User A's Level 1

---

## 📋 Test 4: A/B Testing Verification

1. **Log in** (any user)

2. **Open browser console**

3. **Look for experiment assignment:**
   - Should see: `✅ User [id] assigned to control group for ml_vs_heuristic`
   - OR: `✅ User [id] assigned to treatment group for ml_vs_heuristic`

4. **If Control Group:**
   - Console shows: `Using heuristic learner state determination (control group)`
   - No ML API calls

5. **If Treatment Group:**
   - Console shows: `✅ ML API drop risk prediction: {...}`
   - ML API is being called

6. **Verify No 406 Errors:**
   - Check console for errors
   - Should NOT see: "Failed to load resource: 406"
   - ✅ **PASS** if no 406 errors

7. **Check Supabase Database:**
   - Go to Supabase dashboard
   - Open `experiment_groups` table
   - Should see your user_id with assigned group
   - ✅ **PASS** if record exists

---

## 📋 Test 5: ML API Health

1. **Open new tab:** http://localhost:8000/docs

2. **Verify Swagger UI loads:**
   - Should see FastAPI documentation
   - Should list all endpoints

3. **Test /health endpoint:**
   - Click on `/health` → "Try it out" → "Execute"
   - Should return: `{"status": "healthy"}`

4. **Test /predict/drop-risk endpoint:**
   - Click on `/predict/drop-risk` → "Try it out"
   - Use this test data:
   ```json
   {
     "user_id": "test-user",
     "features": {
       "days_since_last_active": 2,
       "activity_frequency": 0.5,
       "average_score": 75,
       "total_attempts": 10,
       "completion_time_vs_median": 1.2,
       "retry_ratio": 1.5,
       "score_variance": 10,
       "recent_xp_velocity": 50
     }
   }
   ```
   - Click "Execute"
   - Should return prediction with `drop_risk`, `confidence`, `model_version`

---

## ✅ Success Criteria

**All tests PASS if:**

1. ✅ User A and User B have completely isolated progress
2. ✅ Course progress bars show correct per-user data
3. ✅ No 406 errors in console
4. ✅ Experiment assignment working (control/treatment)
5. ✅ ML API responding correctly
6. ✅ LocalStorage migration runs automatically on login

---

## ❌ If Tests Fail

**User progress still shared:**
- Clear browser cache completely
- Try incognito/private window
- Check console for migration errors

**406 errors:**
- Verify Supabase migration was deployed
- Check `experiment_groups` table exists

**ML API not responding:**
- Check terminal: `python -m uvicorn main:app --reload` is running
- Verify port 8000 is not blocked

---

## 📝 Report Results

After testing, report:
1. Which tests passed ✅
2. Which tests failed ❌
3. Any console errors
4. Screenshots if needed

**Ready to test!** Start with Test 1 (clearing localStorage) and work through each test in order.
