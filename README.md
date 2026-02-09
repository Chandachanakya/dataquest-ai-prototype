# DataQuestAI - Personalized Learning Platform

> An AI-powered adaptive learning platform with event-driven analytics and intelligent personalization.

## 🎯 Project Overview

DataQuestAI is a gamified learning platform that uses **rule-based AI** to personalize the learning experience based on real-time performance data. The system tracks every quest attempt, analyzes learner behavior, and automatically adapts content recommendations.

**Key Innovation**: Event-driven analytics with auditable decision logging - every personalization action is tracked and explained.

---

## ✨ Features

### 🎮 Core Learning Experience
- **Interactive Quests**: Quiz-based, coding challenges, and game-based learning
- **XP & Leveling System**: Gamified progression with badges and achievements
- **Streak Tracking**: Daily engagement rewards
- **Multiple Courses**: Python, Machine Learning, SQL, Data Visualization

### 🤖 AI Personalization Engine
- **Learner State Detection**: Automatically classifies users as STRUGGLING, FAST, CONSISTENT, or DROP_RISK
- **Adaptive Recommendations**: Quest difficulty adjusts based on performance
- **State-Based Insights**: Personalized feedback and encouragement
- **Decision Logging**: Full transparency - see why the system made each decision

### 📊 Analytics Dashboard
- **Learning Score (0-100)**: Average quiz performance
- **Quest Attempts**: Total attempts with persistence tracking
- **Avg Time per Quest**: Efficiency metrics
- **Learning Trend**: Improvement over time
- **Engagement XP**: Overall progress tracking
- **AI Personalization History**: Auditable decision logs

### 👥 Social Features
- **Community Forum**: Ask questions, share knowledge
- **Peer Challenges**: Compete with friends
- **Leaderboard**: Global rankings

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: TanStack Query
- **Routing**: React Router

### Database Schema
- `profiles` - User data and preferences
- `quest_attempts` - **Event-driven tracking** of every attempt
- `user_progress` - Aggregated quest completion data
- `decision_logs` - **Auditable AI decisions**
- `learner_states` - Computed learner classifications

### Learner State Engine

Located in `src/lib/learnerEngine.ts`:

1. **Metric Calculation**: Queries `quest_attempts` for avg score, completion time, activity frequency
2. **State Detection**: Rule-based classification with priority order
3. **Action Triggering**: Logs personalization decisions to `decision_logs`

**State Definitions**:
- **DROP_RISK**: Inactive > 7 days
- **STRUGGLING**: Avg score < 50%, attempts ≥ 3
- **FAST**: Avg score > 80%, XP > 200
- **CONSISTENT**: Default (steady progress)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd dataquest-ai-prototype

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run database migrations (see MIGRATION_GUIDE.md)

# Start development server
npm run dev
```

### Database Setup

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on running SQL migrations.

---

## 📚 Documentation

- **[Walkthrough](./walkthrough.md)**: Implementation details and testing
- **[Migration Guide](./MIGRATION_GUIDE.md)**: Database setup instructions
- **[Testing Guide](./TESTING_GUIDE.md)**: How to simulate different learner states

---

## 🔮 Future Scope

The current system establishes a **solid data foundation** for advanced ML-based personalization:

### Phase 1: Machine Learning Models
- **Collaborative Filtering**: Recommend quests based on similar users
- **Predictive Analytics**: Forecast drop risk before it happens
- **Clustering**: Discover new learner archetypes beyond the 4 states

### Phase 2: Reinforcement Learning
- **RL-Based Quest Sequencing**: Optimize learning path for each user
- **Multi-Armed Bandits**: A/B test different intervention strategies
- **Adaptive Difficulty**: Real-time quest difficulty adjustment

### Phase 3: Advanced Features
- **Natural Language Processing**: Analyze forum posts for sentiment and topic modeling
- **Computer Vision**: Automated code review for coding challenges
- **Spaced Repetition**: Intelligent review scheduling based on forgetting curves

### Phase 4: Scalability
- **Real-Time Analytics**: Stream processing for instant state updates
- **Distributed Computing**: Handle millions of concurrent users
- **Edge Computing**: Offline-first mobile app with sync

**Note**: The current rule-based system is intentionally simple but **production-ready**. It provides:
- ✅ Defensible data (event-driven, not inferred)
- ✅ Auditable decisions (full transparency)
- ✅ Proven personalization (state-based recommendations work)
- ✅ ML-ready foundation (clean data schema for future models)

---

## 🧪 Testing

### Run Simulations
```bash
# See TESTING_GUIDE.md for detailed instructions
# Use simulation_data.sql to generate test scenarios
```

### Verify Implementation
1. Complete a quest → Check `quest_attempts` table
2. View Dashboard → Check personalized insights
3. View Analytics → Check decision logs

---

## 📄 License

This project was created with [Lovable](https://lovable.dev).

---

## 🤝 Contributing

This is a prototype/academic project. For questions or suggestions, please open an issue.

---

## 📞 Support

For deployment or custom domain setup, see [Lovable Documentation](https://docs.lovable.dev).

