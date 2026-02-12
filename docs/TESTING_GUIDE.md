# Manual Testing Guide - ML Integration

## Quick Start Testing

### Prerequisites
- ML API running on port 8000
- Frontend dev server running
- `.env` file configured

---

## Test 1: Verify ML API is Running ✅

**Steps:**
1. Open browser to: `http://localhost:8000/`
2. You should see JSON response:

```json
{
  "service": "DataQuest AI - ML API",
  "status": "healthy",
  "version": "1.0.0",
  "model_version": "mock_v1",
  "using_real_model": false,
  "timestamp": "2026-02-12T15:30:00"
}
```

**Expected:** Status is "healthy"

---

## Test 2: Test Drop Risk Endpoint

**Using Browser (easiest):**

1. Open browser console (F12)
2. Paste this code:

```javascript
fetch('http://localhost:8000/predict/drop-risk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'test-user',
    days_since_last_active: 15,
    activity_frequency: 5,
    average_score: 50
  })
})
.then(r => r.json())
.then(data => console.log('✅ Drop Risk Prediction:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected Output:**
```json
{
  "user_id": "test-user",
  "probability": 0.85,
  "risk_level": "high",
  "model_version": "mock_v1",
  "timestamp": "...",
  "features_used": { ... }
}
```

---

## Test 3: Frontend Integration - Heuristic Mode

**Steps:**

1. **Update `.env`:**
   ```env
   VITE_USE_ML_API=false
   ```

2. **Restart dev server:**
   ```bash
   npm run dev
   ```

3. **Open app** and navigate to Dashboard

4. **Open browser console** (F12)

5. **Look for log:**
   ```
   Using heuristic learner state determination
   ```

**Expected:** ✅ System uses heuristics (existing behavior)

---

## Test 4: Frontend Integration - ML API Mode

**Steps:**

1. **Ensure ML API is running:**
   ```bash
   cd api
   python main.py
   ```
   
   Should see:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

2. **Update `.env`:**
   ```env
   VITE_USE_ML_API=true
   VITE_ML_API_URL=http://localhost:8000
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

4. **Open app** and navigate to Dashboard

5. **Open browser console** (F12)

6. **Look for logs:**
   ```
   ✅ ML API drop risk prediction: {user_id: "...", probability: 0.35, ...}
   ```

**Expected:** ✅ System uses ML API predictions

---

## Test 5: Graceful Fallback

**Steps:**

1. **Keep `.env` with ML enabled:**
   ```env
   VITE_USE_ML_API=true
   ```

2. **STOP the ML API server** (Ctrl+C in API terminal)

3. **Refresh the app**

4. **Open browser console**

5. **Look for logs:**
   ```
   ML API unavailable, falling back to heuristics: ...
   Using heuristic learner state determination
   ```

**Expected:** ✅ System falls back to heuristics gracefully (no errors)

---

## Test 6: Verify Decision Logging

**Steps:**

1. **Run app with ML API enabled** (Test 4)

2. **Navigate around** (trigger some learner state calculations)

3. **Check Supabase** `decision_logs` table:

```sql
SELECT 
  user_id,
  state_detected,
  metadata->>'decisionSource' as source,
  metadata->>'mlModelVersion' as model,
  metadata->'ml_api_status'->>'enabled' as ml_enabled,
  timestamp
FROM decision_logs
ORDER BY timestamp DESC
LIMIT 5;
```

**Expected Results:**

| user_id | state_detected | source | model | ml_enabled |
|---------|---------------|--------|-------|------------|
| user-123 | CONSISTENT | ml_api | mock_v1 | true |

---

## Troubleshooting

### ❌ ML API won't start

**Solution:**
```bash
cd api
pip install fastapi uvicorn pydantic
python main.py
```

### ❌ CORS errors in browser

**Check:** ML API logs should show:
```
INFO:     127.0.0.1:xxxxx - "POST /predict/drop-risk HTTP/1.1" 200 OK
```

If you see CORS errors, verify `main.py` has:
```python
allow_origins=["http://localhost:5173", "http://localhost:3000"]
```

### ❌ Frontend not calling ML API

1. Check `.env` has `VITE_USE_ML_API=true`
2. **Restart dev server** after changing `.env`
3. Hard refresh browser (Ctrl+Shift+R)
4. Check console for errors

### ❌ "Using heuristic" even with ML enabled

**Possible causes:**
1. ML API not running → Start it
2. Wrong URL in `.env` → Check `VITE_ML_API_URL`
3. Firewall blocking → Try `http://127.0.0.1:8000`

---

## Success Checklist

- [ ] ML API health check returns "healthy"
- [ ] Drop risk endpoint returns valid JSON
- [ ] Frontend works with `VITE_USE_ML_API=false`
- [ ] Frontend works with `VITE_USE_ML_API=true`
- [ ] Frontend falls back when API is down
- [ ] Browser console shows ML API logs when enabled
- [ ] Browser console shows heuristic logs when disabled/fallback
- [ ] No errors in browser console
- [ ] No errors in ML API logs
- [ ] Decision logs include `decisionSource` field

---

## Next Steps After Testing

Once all tests pass:

1. ✅ **Phase 4 Complete** - ML integration working
2. 📊 **Phase 5** - Set up A/B testing
3. 🚀 **Deploy** - Move to production

---

## Quick Reference

**Start ML API:**
```bash
cd api
python main.py
```

**Start Frontend:**
```bash
npm run dev
```

**Toggle ML API:**
```env
# .env file
VITE_USE_ML_API=true   # Use ML
VITE_USE_ML_API=false  # Use heuristics
```

**Check ML API:**
```
http://localhost:8000/
http://localhost:8000/docs  # Swagger UI
```
