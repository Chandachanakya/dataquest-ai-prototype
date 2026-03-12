# ML Integration Testing

This directory contains tests for the ML API integration.

## Test Scripts

### 1. `test_ml_integration.py`

Comprehensive integration test for the ML API endpoints.

**Tests:**
- ✅ Health check
- ✅ Drop risk prediction
- ✅ Intervention recommendation
- ✅ Next quest recommendation
- ✅ Error handling

**Usage:**

```bash
# Make sure ML API is running first
cd api
python main.py

# In another terminal, run tests
cd tests
python test_ml_integration.py
```

**Expected Output:**

```
============================================================
ML API INTEGRATION TEST SUITE
============================================================
Timestamp: 2026-02-12 15:30:00
API URL: http://localhost:8000
============================================================

============================================================
TEST: Health Check
============================================================
✅ ML API is running
ℹ️  Service: DataQuest AI - ML API
ℹ️  Status: healthy
ℹ️  Model Version: mock_v1
ℹ️  Using Real Model: False

... (more tests)

============================================================
TEST SUMMARY
============================================================
Health Check: PASS
Drop Risk: PASS
Intervention: PASS
Next Quest: PASS
Error Handling: PASS

Total: 5/5 tests passed

✅ ALL TESTS PASSED!
```

## Frontend Integration Testing

### Test 1: Heuristic Mode (Default)

```bash
# Ensure .env has ML API disabled
VITE_USE_ML_API=false

# Run the app
npm run dev

# Navigate to dashboard
# Check browser console - should see:
# "Using heuristic learner state determination"
```

### Test 2: ML API Mode

```bash
# Terminal 1: Start ML API
cd api
python main.py

# Terminal 2: Enable ML API in .env
VITE_USE_ML_API=true

# Run the app
npm run dev

# Navigate to dashboard
# Check browser console - should see:
# "✅ ML API drop risk prediction: {...}"
```

### Test 3: Fallback Behavior

```bash
# Enable ML API in .env
VITE_USE_ML_API=true

# DON'T start the ML API server

# Run the app
npm run dev

# Navigate to dashboard
# Check browser console - should see:
# "ML API unavailable, falling back to heuristics"
# "Using heuristic learner state determination"
```

## Database Verification

Check that decision logs include source tracking:

```sql
-- Connect to Supabase and run:
SELECT 
  user_id,
  state_detected,
  action_taken,
  confidence_score,
  metadata->>'decisionSource' as source,
  metadata->>'mlModelVersion' as model_version,
  metadata->'ml_api_status'->>'enabled' as ml_enabled,
  timestamp
FROM decision_logs
ORDER BY timestamp DESC
LIMIT 10;
```

**Expected columns:**
- `source`: Either 'ml_api' or 'heuristic'
- `model_version`: Model version if ML was used (e.g., 'xgboost_v1')
- `ml_enabled`: 'true' or 'false'

## Manual Testing Checklist

- [ ] ML API health check passes
- [ ] Drop risk prediction returns valid response
- [ ] Intervention recommendation works
- [ ] Next quest recommendation works
- [ ] Frontend works with `VITE_USE_ML_API=false`
- [ ] Frontend works with `VITE_USE_ML_API=true` and API running
- [ ] Frontend falls back to heuristics when API is down
- [ ] Decision logs include `decisionSource` field
- [ ] Decision logs include `ml_api_status` in metadata
- [ ] No errors in browser console
- [ ] No errors in API logs

## Troubleshooting

### ML API won't start

```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Install dependencies
cd api
pip install -r requirements.txt

# Try running with uvicorn directly
uvicorn main:app --reload --port 8000
```

### Frontend not calling ML API

1. Check `.env` file has `VITE_USE_ML_API=true`
2. Restart the dev server after changing `.env`
3. Check browser console for errors
4. Verify ML API is running at `http://localhost:8000`

### CORS errors

The API already has CORS configured for `localhost:5173` and `localhost:3000`. If using a different port, update `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:YOUR_PORT"],
    ...
)
```
