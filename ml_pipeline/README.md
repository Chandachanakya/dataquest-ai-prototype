# ML Pipeline - DataQuest AI

This directory contains the machine learning pipeline for upgrading from heuristic-based simulation to real data-driven adaptive personalization.

## 📁 Directory Structure

```
ml_pipeline/
├── export_data.py          # Extract data from Supabase
├── preprocess.py           # Feature engineering
├── train.py                # Model training with CV
├── evaluate.py             # Offline evaluation (TODO)
├── requirements.txt        # Python dependencies
├── data/                   # Raw exported data (CSV)
├── processed/              # Processed features (CSV)
├── models/                 # Trained model artifacts (.pkl)
└── results/                # Training results and plots
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd ml_pipeline
pip install -r requirements.txt
```

### 2. Export Data from Supabase

```bash
python export_data.py
```

This will:
- Extract data from `quest_attempts`, `decision_logs`, `action_logs`, `learner_states`, and `user_progress` tables
- Save raw CSV files to `data/` directory
- Perform data quality checks

### 3. Preprocess and Engineer Features

```bash
python preprocess.py
```

This will:
- Create 8 behavioral features
- Generate drop risk labels
- Save processed data to `processed/features.csv`

### 4. Train Models

```bash
python train.py
```

This will:
- Train Logistic Regression, Random Forest, and XGBoost
- Perform 5-fold cross-validation
- Save models to `models/` directory
- Generate feature importance plots

## 📊 Features

The pipeline creates 8 behavioral features:

1. **days_since_last_active**: Days since last quest completion
2. **activity_frequency**: Active days in last 30 days
3. **average_score**: Mean score (expanding window)
4. **total_attempts**: Cumulative quest attempts
5. **completion_time_vs_median**: Completion time percentile
6. **retry_ratio**: Attempts per unique quest
7. **score_variance**: Score consistency metric
8. **recent_xp_velocity**: XP per day in last 7 days

## 🎯 Labels

- **drop_risk_label**: Binary (1 if days_since_last_active > 10, else 0)

## 📈 Models

Three models are trained and compared:

1. **Logistic Regression** (baseline)
2. **Random Forest** (ensemble)
3. **XGBoost** (gradient boosting)

Evaluation metrics:
- ROC-AUC (primary)
- F1 Score
- Precision
- Recall

## ⚠️ Data Requirements

Before training:
- Minimum 500 quest events
- Balanced drop-risk labels (not all 0s or 1s)
- Clean timestamps with no null features

## 📝 Next Steps

After training:
1. Create FastAPI microservice (`../api/`)
2. Integrate with TypeScript frontend (`learnerEngine.ts`)
3. Set up A/B testing infrastructure
4. Run 2-week experiment
5. Analyze results

## 🔗 Related Files

- Implementation Plan: `../brain/*/implementation_plan.md`
- Task Checklist: `../brain/*/task.md`
- Learner Engine: `../src/lib/learnerEngine.ts`
