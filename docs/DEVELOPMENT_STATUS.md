# DataQuest AI — Development Status

**Last Updated:** 2026-02-25  
**Project Status:** ✅ Production Ready — Phases 1–7 Complete

---

## 📋 Executive Summary

DataQuest AI is an adaptive learning platform that uses machine learning to personalise the learning experience. The system has progressed through seven phases: from raw data generation and model training, through API deployment, A/B testing infrastructure, and real-time ML predictions, to a fully integrated gamification loop, dropout-triggered intervention engine, and adaptive quiz difficulty system.

**Current State:**
- ✅ Full-stack React + FastAPI application operational
- ✅ ML models trained, evaluated, and deployed (Random Forest ROC-AUC: 1.00 on hold-out)
- ✅ A/B testing infrastructure live (50/50 control/treatment)
- ✅ Real ML dropout predictions in production (treatment group)
- ✅ Progressive XP/Level system with streak tracking
- ✅ Real-time intervention engine (dropout prob ≥ 0.70 → adaptive suggestions)
- ✅ Four-band adaptive difficulty system (Beginner → Expert, 1×–2× XP)

---

## 🎯 Phase Overview

### Phase 1: Data Pipeline ✅ COMPLETE
**Goal:** Generate training data and engineer features for ML models

- Generated 622 realistic quest attempts from 150 simulated users
- Created 4 user personas: `fast_learner`, `struggling`, `consistent`, `drop_risk`
- Engineered 10 behavioural features
- Prepared 118 user samples with complete feature sets

**10 Features Engineered:**

| # | Feature | Description |
|---|---------|-------------|
| 1 | `days_since_last_active` | Drop risk indicator |
| 2 | `activity_frequency` | Engagement metric (active days/month) |
| 3 | `average_score` | Performance normalised by difficulty |
| 4 | `total_attempts` | Activity level |
| 5 | `completion_time_vs_median` | Speed relative to median |
| 6 | `retry_ratio` | Persistence |
| 7 | `score_variance` | Consistency |
| 8 | `recent_xp_velocity` | XP/day (recent engagement) |
| 9 | `completion_rate` | Success rate % |
| 10 | `avg_difficulty` | Challenge level attempted |

**Key Files:** `ml_pipeline/generate_training_data.py`, `ml_pipeline/engineer_features.py`, `ml_pipeline/data/`

---

### Phase 2: Model Training ✅ COMPLETE
**Goal:** Train ML models for drop risk prediction

**Models:**
- **Logistic Regression** (Baseline) → `ml_pipeline/models/drop_risk_lr_v1.pkl`
- **Random Forest** (Primary) → `ml_pipeline/models/drop_risk_rf_v1.pkl`

**Latest Evaluation Results** *(from `ml_pipeline/evaluate.py`, run 2026-02-25)*:

| Metric | Logistic Regression | Random Forest |
|--------|:-------------------:|:-------------:|
| ROC-AUC (CV) | 0.9671 ± 0.019 | **0.9913 ± 0.008** |
| F1 (CV) | 0.900 ± 0.068 | **0.941 ± 0.054** |
| Precision (CV) | 0.921 | **0.971** |
| Recall (CV) | 0.886 | **0.914** |
| ROC-AUC (hold-out) | 0.966 | **1.000** |
| F1 (hold-out) | 0.800 | **0.933** |
| Accuracy (hold-out) | 87.5% | **95.8%** |
| Brier Score | 0.083 | **0.032** |

*Dataset: 118 users · 5-fold stratified CV · 80/20 hold-out split*

**Top Feature Importance (Random Forest):**
1. `completion_time_vs_median` — 34.6%
2. `recent_xp_velocity` — 23.9%
3. `average_score` — 8.4%

**Key Files:** `ml_pipeline/train_models.py`, `ml_pipeline/evaluate.py`, `ml_pipeline/models/evaluation_report.txt`

---

### Phase 3: FastAPI Microservice ✅ COMPLETE
**Goal:** Deploy ML models as a REST API

**Endpoints:**
- `GET /` — Health check (shows model version + `using_real_model`)
- `POST /predict/drop-risk` — Dropout probability prediction
- `POST /predict/intervention` — Intervention recommendation
- `POST /recommend/next-quest` — Quest sequencing

**Architecture:**
- Primary model: Random Forest (`random_forest_v1`)
- Fallback: Logistic Regression → then mock predictions
- `api/main.py` now includes `sys.path.insert(0, dirname(__file__))` so `schemas` and `inference` always resolve to local files regardless of launch directory

**How to run (from project root):**
```bash
python -m uvicorn api.main:app --port 8000 --reload
```

**Key Files:** `api/main.py`, `api/schemas.py`, `api/inference.py`, `api/requirements.txt`

---

### Phase 4: TypeScript Integration ✅ COMPLETE
**Goal:** Integrate ML API with frontend

- `src/lib/mlApiClient.ts` — `predictDropRisk()`, graceful fallback to heuristics on connection refused
- `src/lib/learnerEngine.ts` — A/B routing; logs `dropout_probability`, `intervention_case`, `intervention_accepted` in decision metadata

**Env vars required:**
```env
VITE_USE_ML_API=true
VITE_ML_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

### Phase 5: A/B Testing Infrastructure ✅ COMPLETE
**Goal:** Compare ML vs heuristic personalisation

- **Control (50%):** Heuristic state machine
- **Treatment (50%):** ML dropout prediction via API
- Deterministic hash-based assignment (stable across sessions)
- Tables: `experiment_groups`, `experiment_metrics` (Supabase + RLS)

---

### Phase 6: Evaluation & Reporting ✅ COMPLETE
**Goal:** Offline evaluation + research narrative

- `ml_pipeline/evaluate.py` — 5-fold CV + hold-out metrics + feature importance + confusion matrices
- `ml_pipeline/models/evaluation_report.txt` — persisted report
- `docs/RESEARCH_REPORT.md` — full research narrative

---

### Phase 7: Gamification, Interventions & Adaptive Difficulty ✅ COMPLETE
**Goal:** Strengthen engagement loop and close the ML→UI feedback loop

#### 7a — Gamification Loop
| Component | What it does |
|-----------|-------------|
| `XPBar.tsx` | Progressive XP scaling: Level N requires N × 200 XP |
| `streakService.ts` | Daily streak tracking with milestone XP (+100/+200/+500 at 7/14/30 days) and streak freeze (1 per 7-day milestone) — stored in localStorage |
| `StreakBadge.tsx` | Flame badge with milestone glow + freeze button |
| `QuestCard.tsx` | Mission framing ("Accept Mission ⚔️"), per-difficulty objective, Expert crown + 2× XP label |
| `types.ts` | `difficulty` union includes `'expert'`; `Quest` has optional `objective` field |

#### 7b — ML Real-Time Intervention Engine
| Component | What it does |
|-----------|-------------|
| `interventionEngine.ts` | Post-quiz: if dropout prob ≥ 0.70, classifies case and builds payload |
| `InterventionBanner.tsx` | 3-case adaptive card (2× XP / warm-up / guided mode); Accept/Dismiss logs to `decision_logs` |
| `CongratulationsModal.tsx` | Accepts `interventionSlot` ReactNode; shows difficulty verdict badge |

**Intervention Cases:**

| Case | Trigger | Response |
|------|---------|----------|
| `LOW_XP_VELOCITY` | XP/day < 10 | 2× XP challenge |
| `SLOW_COMPLETION` | time > 1.8× median | Warm-up quest |
| `LOW_COMPLETION_RATE` | completion < 40% | Guided mode + hints |

#### 7c — Adaptive Quiz Difficulty

| Band | XP Multiplier | Promote if | Demote if |
|------|:---:|---|---|
| Beginner | 1.0× | accuracy ≥ 85% | — |
| Intermediate | 1.3× | accuracy ≥ 85% | accuracy ≤ 60% |
| Advanced | 1.6× | ≥ 85% + high server confidence | accuracy ≤ 60% |
| Expert | **2.0×** | promoted from Advanced | accuracy ≤ 60% |

- `difficultyEngine.ts` — full 4-band logic, localStorage caching, server sync
- `QuestPage.tsx` — evaluates difficulty after every quiz, scales XP, triggers ML prediction and intervention
- `reinforcementLearning.ts / DifficultyRecommendation` — updated to include `'expert'` band

---

## 🐛 Bug Fixes & Hotfixes

| Issue | Status | Fix |
|-------|--------|-----|
| User progress isolation (shared localStorage keys) | ✅ Fixed | User-specific keys + `localStorageMigration.ts` |
| CORS blocking frontend→API | ✅ Fixed | Added `localhost:8080` to allowed origins |
| 406 errors (missing experiment tables) | ✅ Fixed | Deployed Supabase migration |
| `ImportError: DropRiskRequest` on API startup | ✅ Fixed | `sys.path.insert(0, dirname(__file__))` in `api/main.py` |
| CongratulationsModal screen blink | ✅ Fixed | Lazy `useState(randomQuote)` initialiser |
| CongratulationsModal too large | ✅ Fixed | Reduced to `sm:max-w-sm`, smaller trophy/spacing (~20%) |
| `streak_freeze_available` / `last_active_date` missing from Supabase types | ✅ Fixed | localStorage-only storage for these fields |

---

## 📊 System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                       │
│                      http://localhost:8080                        │
│                                                                   │
│  Dashboard   QuestPage   Analytics   Courses   CongratModal      │
│      │           │                                  ↑            │
│      ▼           ▼                                  │            │
│  LearnerEngine ──→ A/B split ──→ ML API or Heuristic│            │
│  streakService    difficultyEngine   interventionEngine          │
│  XPBar  StreakBadge  QuestCard  InterventionBanner               │
└──────────────────────────────────────────────────────────────────┘
                        │                    │
              Control (50%)         Treatment (50%)
              Heuristic logic       ↓
                                ML API (FastAPI)
                                http://localhost:8000
                                  Random Forest (primary)
                                  Logistic Regression (fallback)
                        │
                        ▼
                 Supabase (PostgreSQL)
                 profiles · quest_attempts · user_progress
                 experiment_groups · experiment_metrics · decision_logs
```

---

## 📁 Key File Structure

```
dataquest-ai-prototype/
├── api/
│   ├── main.py          # FastAPI app + sys.path fix
│   ├── schemas.py       # Pydantic request/response models
│   ├── inference.py     # Model loading + prediction logic
│   └── requirements.txt
│
├── ml_pipeline/
│   ├── data/            # training_features.csv (118 users)
│   ├── models/          # drop_risk_rf_v1.pkl, drop_risk_lr_v1.pkl
│   ├── evaluate.py      # Offline evaluation (5-fold CV + hold-out)
│   ├── train_models.py
│   └── engineer_features.py
│
├── src/
│   ├── lib/
│   │   ├── mlApiClient.ts         # predictDropRisk()
│   │   ├── learnerEngine.ts       # A/B routing + logDecision
│   │   ├── experimentService.ts   # A/B assignment
│   │   ├── streakService.ts       # [NEW] daily streaks + milestones
│   │   ├── difficultyEngine.ts    # [NEW] 4-band adaptive difficulty
│   │   ├── interventionEngine.ts  # [NEW] dropout → intervention payload
│   │   ├── reinforcementLearning.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── XPBar.tsx              # Progressive XP bar
│   │   ├── StreakBadge.tsx        # [NEW] streak flame badge
│   │   ├── InterventionBanner.tsx # [NEW] 3-case intervention card
│   │   ├── QuestCard.tsx          # Mission framing + expert styling
│   │   └── CongratulationsModal.tsx # Difficulty badge + intervention slot
│   └── pages/
│       ├── Dashboard.tsx          # StreakBadge + difficulty sync
│       ├── QuestPage.tsx          # Full adaptive quiz logic
│       └── Analytics.tsx
│
└── docs/
    └── DEVELOPMENT_STATUS.md     # This file
```

---

## 🚀 How to Run

```bash
# 1. Frontend
npm install && npm run dev
# → http://localhost:8080

# 2. ML API (always from project root)
python -m uvicorn api.main:app --port 8000 --reload
# → http://localhost:8000

# 3. Re-evaluate models (optional)
cd ml_pipeline && python evaluate.py
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ImportError: cannot import name 'DropRiskRequest'` | Run uvicorn from project root: `python -m uvicorn api.main:app ...` |
| `ERR_CONNECTION_REFUSED` on dashboard | ML API not running — start it (see above). App falls back to heuristics automatically |
| ML API not loading models | `cd ml_pipeline && python train_models.py` |
| CORS error | Check frontend origin is in `api/main.py` `allow_origins` list |

---

## ✅ Completion Checklist

### Phase 1 — Data Pipeline
- [x] Generate training data · [x] Engineer 10 features · [x] Validate quality

### Phase 2 — Model Training
- [x] Logistic Regression · [x] Random Forest · [x] 5-fold CV · [x] Feature importance

### Phase 3 — API Deployment
- [x] FastAPI service · [x] Load models · [x] CORS · [x] sys.path fix

### Phase 4 — Frontend Integration
- [x] ML API client · [x] Learner engine routing · [x] Fallback handling

### Phase 5 — A/B Testing
- [x] DB schema · [x] User assignment · [x] Both groups operational

### Phase 6 — Evaluation & Reporting
- [x] `evaluate.py` (5-fold CV + hold-out) · [x] Feature importance · [x] Research report

### Phase 7 — Gamification, Interventions & Adaptive Difficulty
- [x] Progressive XP bar (level N = N × 200 XP)
- [x] Daily streak system + milestone XP + freeze
- [x] StreakBadge UI
- [x] Quest mission framing ("Accept Mission", objective, Expert styling)
- [x] 4-band adaptive difficulty (Beginner → Expert)
- [x] XP scaling per difficulty band (1× → 2×)
- [x] Intervention engine (dropout ≥ 0.70 → classify → banner)
- [x] InterventionBanner (3 cases, Accept/Dismiss logging)
- [x] CongratulationsModal: difficulty verdict badge + intervention slot
- [x] TypeScript compile: zero errors

---

**🎉 Project Status: PRODUCTION READY — ALL 7 PHASES COMPLETE**
