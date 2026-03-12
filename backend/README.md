# ML API - FastAPI Microservice

Machine Learning inference API for DataQuest AI adaptive personalization.

## 🚀 Quick Start

### 1. Install Dependencies

From the `backend` directory:

```bash
pip install -r requirements.txt
```

### 2. Run the API

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 3. View API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API Endpoints

### 1. Drop Risk Prediction

**POST** `/predict/drop-risk`

Predicts the probability of a user dropping out.

**Request:**
```json
{
  "user_id": "user-123",
  "days_since_last_active": 5,
  "activity_frequency": 10,
  "average_score": 75.5,
  "total_attempts": 25,
  "completion_time_vs_median": 1.2,
  "retry_ratio": 1.5,
  "score_variance": 12.3,
  "recent_xp_velocity": 150.0
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "probability": 0.35,
  "risk_level": "low",
  "model_version": "xgboost_v1",
  "timestamp": "2026-02-12T15:30:00",
  "features_used": { ... }
}
```

### 2. Intervention Recommendation

**POST** `/predict/intervention`

Recommends the best intervention for a user.

**Request:**
```json
{
  "user_id": "user-123",
  "context": {
    "learner_state_distribution": {
      "Drop-risk": 0.6,
      "Struggling": 0.3,
      "Consistent": 0.1
    },
    "recent_performance": 65.0,
    "fatigue_score": 0.4
  }
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "intervention_type": "encouragement",
  "expected_reward": 0.7,
  "confidence": 0.75,
  "reason": "User showing drop-risk signals",
  "model_version": "mock_v1",
  "timestamp": "2026-02-12T15:30:00"
}
```

### 3. Next Quest Recommendation

**POST** `/predict/next-quest`

Recommends the optimal next quest for a user.

**Request:**
```json
{
  "user_id": "user-123",
  "available_quests": [
    {"id": "quest-1", "difficulty": "beginner", "topic": "python"},
    {"id": "quest-2", "difficulty": "intermediate", "topic": "ml"}
  ],
  "user_state": {
    "current_level": 5,
    "recent_topics": ["python", "data-viz"]
  }
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "quest_id": "quest-1",
  "expected_reward": 0.75,
  "reason": "Recommended based on difficulty progression",
  "model_version": "mock_v1",
  "timestamp": "2026-02-12T15:30:00"
}
```

## 🧪 Testing

### Using curl

```bash
# Drop risk prediction
curl -X POST http://localhost:8000/predict/drop-risk \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "days_since_last_active": 5, "activity_frequency": 10}'

# Intervention recommendation
curl -X POST http://localhost:8000/predict/intervention \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user", "context": {"learner_state_distribution": {"Drop-risk": 0.6}}}'
```

### Using Python

```python
import requests

# Drop risk prediction
response = requests.post(
    "http://localhost:8000/predict/drop-risk",
    json={
        "user_id": "test-user",
        "days_since_last_active": 5,
        "activity_frequency": 10,
        "average_score": 75.0
    }
)
print(response.json())
```

## 🔄 Model Versioning

The API automatically loads trained models from `../ml_pipeline/models/`:
- `xgboost_v1.pkl` - Drop risk prediction model
- `intervention_v1.pkl` - Intervention recommendation model (TODO)
- `sequencing_v1.pkl` - Quest sequencing model (TODO)

If models are not found, the API falls back to mock predictions for testing.

## 🔗 Integration with Frontend

Update `learnerEngine.ts` to call the ML API:

```typescript
const USE_ML_API = import.meta.env.VITE_USE_ML_API === 'true';

async function determineLearnerState(userId: string) {
  if (USE_ML_API) {
    try {
      const response = await fetch('http://localhost:8000/predict/drop-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, /* features */ })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML API failed, falling back to heuristics', error);
      // Fallback to heuristic logic
    }
  }
  // Heuristic logic
}
```

## 📊 Current Status

- ✅ API structure and endpoints implemented
- ✅ Mock predictions for testing
- ⏳ Real ML models (waiting for training data)
- ⏳ Contextual bandit for interventions
- ⏳ Supervised policy learning for sequencing

## 🚧 Next Steps

1. Train real models once data is available (500+ quest events)
2. Replace mock predictions with real model inference
3. Implement A/B testing infrastructure
4. Deploy to production environment
