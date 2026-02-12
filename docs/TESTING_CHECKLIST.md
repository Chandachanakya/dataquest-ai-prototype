# Testing Checklist - User Progress Isolation & A/B Testing

## ✅ Completed
- [x] Fixed user progress isolation in all courses
- [x] Deployed A/B testing database tables
- [x] Integrated automatic localStorage migration
- [x] Fixed course progress bar isolation

## 🧪 Testing Required

### 1. User Progress Isolation Test

**Setup:**
1. Open browser console (F12)
2. Clear old localStorage:
```javascript
localStorage.removeItem('sql_course_progress');
localStorage.removeItem('ml_course_progress');
localStorage.removeItem('visualization_course_progress');
location.reload();
```

**Test Steps:**
1. **User A Login:**
   - Log in as User A
   - Go to SQL course
   - Complete Level 1
   - Check: Progress shows 1 level completed ✓
   - Check console: Should see migration message

2. **User B Login:**
   - Log out
   - Log in as User B (different account)
   - Go to SQL course
   - Check: Progress should be 0 (NOT showing User A's progress) ✓
   - Complete Level 2
   - Check: Progress shows 1 level completed ✓

3. **User A Return:**
   - Log out
   - Log in as User A again
   - Go to SQL course
   - Check: Should see Level 1 completed (NOT Level 2) ✓

4. **Courses Page:**
   - Check /courses page
   - Verify completion bars show correct per-user progress ✓

### 2. A/B Testing Verification

**Test Steps:**
1. **Check Experiment Assignment:**
   - Log in
   - Open browser console
   - Look for: `✅ User [id] assigned to control/treatment group`
   - Verify no 406 errors

2. **Control Group (Heuristics):**
   - If assigned to control:
   - Console should show: `Using heuristic learner state determination (control group)`
   - No ML API calls

3. **Treatment Group (ML API):**
   - If assigned to treatment:
   - Console should show: `✅ ML API drop risk prediction`
   - ML API is being called

4. **Database Verification:**
   - Go to Supabase dashboard
   - Check `experiment_groups` table
   - Should have user assignment records
   - Check `decision_logs` table
   - Should include `experiment_group` in metadata

### 3. ML API Status

**Check if ML API is running:**
```bash
# In a new terminal
cd d:\experiments\dataquest-ai-prototype\api
python -m uvicorn main:app --reload
```

**Test endpoints:**
- Open http://localhost:8000/docs
- Try `/health` endpoint
- Should return: `{"status": "healthy"}`

## 🐛 Known Issues

- ✅ FIXED: User progress shared across users
- ✅ FIXED: Course progress bars showing shared data
- ✅ FIXED: 406 errors on experiment_groups table
- ✅ FIXED: DOM nesting warnings in Phase2Cards

## 📊 Next Steps

### Option 1: Data Collection & ML Training
- Create data simulation script
- Generate 500+ quest events
- Train real ML models
- Replace mock predictions

### Option 2: Production Deployment
- Deploy to Vercel/Netlify
- Set up ML API on cloud (Railway/Render)
- Configure environment variables
- Run A/B test with real users

### Option 3: Additional Features
- Add user analytics dashboard
- Implement quest recommendations
- Add achievement system
- Create leaderboard enhancements

## 🎯 Recommended: Test Everything First

Before proceeding, **thoroughly test** user progress isolation and A/B testing to ensure everything works correctly!
