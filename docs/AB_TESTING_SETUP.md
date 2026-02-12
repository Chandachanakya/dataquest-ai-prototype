# A/B Testing Setup Guide

## Quick Deploy to Supabase

The experiment tables need to be created in your Supabase database. Here's how:

### Option 1: Using Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run Migration**
   - Open: `supabase/migrations/20260212000000_create_experiment_tables.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Click "Table Editor" in sidebar
   - You should see:
     - `experiment_groups`
     - `experiment_metrics`

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

---

## Verify It's Working

1. **Refresh your app** (hard refresh: Ctrl+Shift+R)

2. **Check browser console** - You should see:
   ```
   ✅ User [id] assigned to control group for ml_vs_heuristic
   Using heuristic learner state determination (control group)
   ```
   OR
   ```
   ✅ User [id] assigned to treatment group for ml_vs_heuristic
   ✅ ML API drop risk prediction: {...}
   ```

3. **No more 406 errors!**

4. **Check Supabase** - `experiment_groups` table should have your user

---

## Understanding the A/B Test

### Control Group (50% of users)
- **Always uses**: Heuristic-based personalization
- **Console log**: "Using heuristic learner state determination (control group)"
- **Purpose**: Baseline performance

### Treatment Group (50% of users)
- **Always uses**: ML API predictions
- **Console log**: "✅ ML API drop risk prediction"
- **Purpose**: Test if ML improves outcomes

### Assignment
- **Deterministic**: Same user always gets same group (based on user ID hash)
- **50/50 split**: Ensures balanced comparison
- **Logged**: Every decision includes experiment group in metadata

---

## Current Status

✅ **What's Working:**
- User assignment (hash-based, deterministic)
- Control group using heuristics
- Treatment group attempting ML API
- Logging includes experiment group

❌ **What Needs Fixing:**
- 406 error → Deploy migration to create tables
- DOM nesting warning → Fixed in Phase2Cards.tsx

---

## Next Steps

1. **Deploy migration** (see above)
2. **Refresh app** - Verify no 406 errors
3. **Test both groups**:
   - Create a second user account
   - Check if they get different group
4. **Run for 2 weeks** to collect data
5. **Analyze results** with `analyze_experiment.py`

---

## Troubleshooting

### Still getting 406 errors?
- Migration not deployed yet
- Check Supabase dashboard → Table Editor
- Should see `experiment_groups` and `experiment_metrics` tables

### User not being assigned?
- Check browser console for errors
- Verify user is logged in (auth.uid() exists)
- Check RLS policies are enabled

### Both groups using same logic?
- Check `.env` file - `VITE_USE_ML_API` should be ignored (experiment overrides it)
- Check console logs for experiment group assignment
- Verify `learnerEngine.ts` integration is correct
