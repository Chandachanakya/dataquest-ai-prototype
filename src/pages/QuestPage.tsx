import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import QuizView from "@/components/QuizView";
import CodeEditor from "@/components/CodeEditor";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Quest } from "@/lib/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CongratulationsModal } from "@/components/CongratulationsModal";
import InterventionBanner from "@/components/InterventionBanner";
import { checkAndUpdateStreak } from "@/lib/streakService";
import {
  evaluatePerformance,
  getNextDifficulty,
  scaledXP,
  getUserDifficulty,
  saveUserDifficulty,
  type DifficultyBand,
  type DifficultyVerdict,
} from "@/lib/difficultyEngine";
import {
  classifyIntervention,
  buildIntervention,
  fetchUserMetricsForIntervention,
  type InterventionPayload,
} from "@/lib/interventionEngine";
import { predictDropRisk } from "@/lib/mlApiClient";

const QuestPage = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, addXP } = useProfile();

  const [quest, setQuest] = useState<Quest | null>(null);
  const [questLoading, setQuestLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Post-completion state
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isPerfectScore, setIsPerfectScore] = useState(false);
  const [difficultyVerdict, setDifficultyVerdict] = useState<DifficultyVerdict>("maintain");
  const [nextDifficulty, setNextDifficulty] = useState<DifficultyBand>("beginner");

  // Intervention state
  const [intervention, setIntervention] = useState<InterventionPayload | null>(null);
  const [dropoutProb, setDropoutProb] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate('/signin');
  }, [user, authLoading, navigate]);

  // Load quest
  useEffect(() => {
    fetch('/data/sampleQuests.json')
      .then(res => res.json())
      .then((data: Quest[]) => {
        const found = data.find(q => q.id === questId);
        if (found) {
          setQuest(found);
        } else {
          toast.error("Quest not found");
          navigate('/dashboard');
        }
        setQuestLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load quest");
        setQuestLoading(false);
      });
  }, [questId, navigate]);

  // Create attempt record once quest + user are ready
  useEffect(() => {
    const create = async () => {
      if (!quest || !user || attemptId) return;
      const now = new Date();
      setStartTime(now);
      const { data, error } = await supabase
        .from('quest_attempts')
        .insert({ user_id: user.id, quest_id: quest.id, started_at: now.toISOString(), status: 'started' })
        .select('id')
        .single();
      if (!error && data) setAttemptId(data.id);
    };
    create();
  }, [quest, user, attemptId]);

  const handleQuestComplete = async (score: number) => {
    if (!quest || !user || !profile) return;

    const totalQuestions = quest.questions?.length || 1;
    const scorePercentage = Math.min(1.0, score / totalQuestions);
    const accuracyPct = scorePercentage * 100;
    const perfectScore = scorePercentage === 1.0;

    // ── Adaptive difficulty ──────────────────────────────────────
    const currentBand = getUserDifficulty(user.id);
    const verdict = evaluatePerformance(accuracyPct);
    const newBand = getNextDifficulty(currentBand, verdict);
    saveUserDifficulty(user.id, newBand);
    setDifficultyVerdict(verdict);
    setNextDifficulty(newBand);

    // ── XP with difficulty scaling ───────────────────────────────
    const baseXP = Math.round(quest.xpReward * scorePercentage);
    const finalXP = scaledXP(baseXP, newBand);
    setXpEarned(finalXP);
    setIsPerfectScore(perfectScore);

    // ── Record quest_attempts ────────────────────────────────────
    const completedAt = new Date();
    const completionTimeSec = startTime
      ? Math.round((completedAt.getTime() - startTime.getTime()) / 1000)
      : null;

    if (attemptId) {
      await supabase
        .from('quest_attempts')
        .update({
          completed_at: completedAt.toISOString(),
          score: Math.round(accuracyPct),
          completion_time: completionTimeSec,
          status: 'completed',
        })
        .eq('id', attemptId);
    }

    // ── XP + streak ──────────────────────────────────────────────
    await addXP(finalXP);
    await checkAndUpdateStreak(user.id);  // service-level streak (milestone XP awards)

    // ── Badges ───────────────────────────────────────────────────
    const badges = [...(profile.badges || [])];
    if (profile.completed_quests === 0 && !badges.includes("First Quest")) badges.push("First Quest");
    if (perfectScore && !badges.includes("Perfect Score")) badges.push("Perfect Score");
    if (newBand === 'expert' && !badges.includes("Expert Unlocked")) badges.push("Expert Unlocked");

    await updateProfile({ completed_quests: profile.completed_quests + 1, badges });

    // ── user_progress upsert ─────────────────────────────────────
    await supabase.from('user_progress').upsert(
      {
        user_id: user.id,
        quest_id: quest.id,
        completed: true,
        score: Math.round(accuracyPct),
        xp_earned: finalXP,
        attempts: 1,
        completed_at: completedAt.toISOString(),
      },
      { onConflict: 'user_id,quest_id' }
    );

    // ── ML dropout prediction → intervention ─────────────────────
    try {
      const metrics = await fetchUserMetricsForIntervention(user.id);
      const daysSince = 0; // just completed, so 0 days since active
      const mlResult = await predictDropRisk(user.id, {
        days_since_last_active: daysSince,
        activity_frequency: metrics.recentXPVelocity,
        average_score: accuracyPct,
        total_attempts: profile.completed_quests + 1,
        completion_time_vs_median: completionTimeSec
          ? completionTimeSec / 300 : 1.0,
        retry_ratio: 1.0,
        score_variance: 0,
        recent_xp_velocity: metrics.recentXPVelocity,
        completion_rate: metrics.completionRate,
        avg_difficulty: 2,
      });

      if (mlResult) {
        const prob = mlResult.probability;
        setDropoutProb(prob);
        metrics.dropoutProbability = prob;
        const interventionCase = classifyIntervention(metrics);
        if (interventionCase) {
          const xpForNext = (profile.level ?? 1) * 200;
          const currentXP = (profile.xp ?? 0) + finalXP;
          setIntervention(buildIntervention(interventionCase, currentXP % xpForNext, xpForNext));
        }
      }
    } catch {
      // Intervention is best-effort — never block the completion flow
    }

    setShowCongratulations(true);
  };

  if (authLoading || profileLoading || questLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quest || !user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading quest...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{quest.title}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{quest.description}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {quest.difficulty}
              </span>
              <span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                {quest.topic}
              </span>
              <span className="text-sm font-semibold bg-gradient-xp text-white px-3 py-1 rounded-full">
                +{quest.xpReward} XP
              </span>
            </div>
          </div>

          {quest.type === 'quiz' && quest.questions && (
            <QuizView questions={quest.questions} onComplete={handleQuestComplete} />
          )}
          {quest.type === 'code' && quest.challenge && (
            <CodeEditor challenge={quest.challenge} onComplete={(success) => handleQuestComplete(success ? 1 : 0)} />
          )}
          {quest.type === 'game' && (
            <div className="text-center p-12 bg-secondary/30 rounded-xl border-2 border-dashed border-border">
              <p className="text-lg text-muted-foreground mb-4">Mini-game — Canvas-based game would go here</p>
              <Button variant="default" onClick={() => handleQuestComplete(1)}>Complete Game Quest</Button>
            </div>
          )}
        </div>
      </main>

      <CongratulationsModal
        open={showCongratulations}
        onClose={() => { setShowCongratulations(false); navigate('/dashboard'); }}
        xpEarned={xpEarned}
        isPerfectScore={isPerfectScore}
        questTitle={quest.title}
        difficultyVerdict={difficultyVerdict}
        nextDifficulty={nextDifficulty}
        interventionSlot={
          intervention && user ? (
            <InterventionBanner
              userId={user.id}
              dropoutProbability={dropoutProb}
              payload={intervention}
              onAccept={() => { setIntervention(null); navigate('/dashboard'); }}
              onDismiss={() => setIntervention(null)}
            />
          ) : null
        }
      />
    </div>
  );
};

export default QuestPage;
