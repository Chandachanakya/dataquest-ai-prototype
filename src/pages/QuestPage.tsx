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

const QuestPage = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    updateStreak,
    addXP,
  } = useProfile();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [questLoading, setQuestLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isPerfectScore, setIsPerfectScore] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Load quest data
    fetch('/data/sampleQuests.json')
      .then(res => res.json())
      .then((data: Quest[]) => {
        const foundQuest = data.find(q => q.id === questId);
        if (foundQuest) {
          setQuest(foundQuest);
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

  // Track quest start time and create attempt record
  useEffect(() => {
    const createAttempt = async () => {
      if (!quest || !user || attemptId) return;

      const now = new Date();
      setStartTime(now);

      const { data, error } = await supabase
        .from('quest_attempts')
        .insert({
          user_id: user.id,
          quest_id: quest.id,
          started_at: now.toISOString(),
          status: 'started'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create quest attempt:', error);
      } else if (data) {
        setAttemptId(data.id);
      }
    };

    createAttempt();
  }, [quest, user, attemptId]);

  const handleQuestComplete = async (score: number) => {
    if (!quest || !user || !profile) return;

    const totalQuestions = quest.questions?.length || 1;
    // Cap score percentage at 100% to prevent bugs from showing >100%
    const scorePercentage = Math.min(1.0, score / totalQuestions);
    const xpEarnedValue = Math.round(quest.xpReward * scorePercentage);
    const perfectScore = scorePercentage === 1;

    setXpEarned(xpEarnedValue);
    setIsPerfectScore(perfectScore);

    // Calculate completion time
    const completedAt = new Date();
    const completionTimeSeconds = startTime
      ? Math.round((completedAt.getTime() - startTime.getTime()) / 1000)
      : null;

    // Update quest_attempts table
    if (attemptId) {
      await supabase
        .from('quest_attempts')
        .update({
          completed_at: completedAt.toISOString(),
          score: Math.round(scorePercentage * 100),
          completion_time: completionTimeSeconds,
          status: 'completed'
        })
        .eq('id', attemptId);
    }

    await addXP(xpEarnedValue);
    await updateStreak();

    const badges = [...(profile.badges || [])];
    if (profile.completed_quests === 0 && !badges.includes("First Quest")) {
      badges.push("First Quest");
    }
    if (scorePercentage === 1 && !badges.includes("Perfect Score")) {
      badges.push("Perfect Score");
    }

    await updateProfile({
      completed_quests: profile.completed_quests + 1,
      badges,
    });

    await supabase.from('user_progress').upsert(
      {
        user_id: user.id,
        quest_id: quest.id,
        completed: true,
        score: Math.round(scorePercentage * 100),
        xp_earned: xpEarnedValue,
        attempts: 1,
        completed_at: completedAt.toISOString(),
      },
      { onConflict: 'user_id,quest_id' }
    );

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
            <QuizView
              questions={quest.questions}
              onComplete={handleQuestComplete}
            />
          )}

          {quest.type === 'code' && quest.challenge && (
            <CodeEditor
              challenge={quest.challenge}
              onComplete={(success) => handleQuestComplete(success ? 1 : 0)}
            />
          )}

          {quest.type === 'game' && (
            <div className="text-center p-12 bg-secondary/30 rounded-xl border-2 border-dashed border-border">
              <p className="text-lg text-muted-foreground mb-4">
                Mini-game placeholder - Canvas-based game would go here
              </p>
              <Button variant="default" onClick={() => handleQuestComplete(1)}>
                Complete Game Quest
              </Button>
            </div>
          )}
        </div>
      </main>

      <CongratulationsModal
        open={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigate('/dashboard');
        }}
        xpEarned={xpEarned}
        isPerfectScore={isPerfectScore}
        questTitle={quest.title}
      />
    </div>
  );
};

export default QuestPage;
