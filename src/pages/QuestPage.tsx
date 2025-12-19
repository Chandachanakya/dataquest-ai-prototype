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
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [questLoading, setQuestLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isPerfectScore, setIsPerfectScore] = useState(false);

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

  const handleQuestComplete = async (score: number) => {
    if (!quest || !user || !profile) return;

    // Calculate XP earned based on score
    const totalQuestions = quest.questions?.length || 1;
    const scorePercentage = score / totalQuestions;
    const xpEarnedValue = Math.round(quest.xpReward * scorePercentage);
    const perfectScore = scorePercentage === 1;
    
    // Store values for congratulations modal
    setXpEarned(xpEarnedValue);
    setIsPerfectScore(perfectScore);

    // Calculate new values
    const newTotalXP = profile.total_xp + xpEarnedValue;
    const newXP = profile.xp + xpEarnedValue;
    const xpPerLevel = 1000;
    let newLevel = profile.level;
    let remainingXP = newXP;

    // Level up logic: Only increase level when XP reaches or exceeds the threshold (1000 XP per level)
    // Handle multiple level-ups if user earns a lot of XP
    while (remainingXP >= xpPerLevel) {
      newLevel++;
      remainingXP -= xpPerLevel;
    }

    // Check for badges
    const badges = [...(profile.badges || [])];
    if (profile.completed_quests === 0 && !badges.includes("First Quest")) {
      badges.push("First Quest");
    }
    if (scorePercentage === 1 && !badges.includes("Perfect Score")) {
      badges.push("Perfect Score");
    }

    // Update streak logic: Only increment once per day
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const lastQuestDate = profile.last_quest_date as string | null;
    
    let newStreak = profile.streak;
    
    // If last quest was today, don't increment streak (already incremented today)
    if (lastQuestDate === today) {
      newStreak = profile.streak; // Keep current streak
    } 
    // If last quest was yesterday, increment streak (continuing streak)
    else if (lastQuestDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastQuestDate === yesterdayStr) {
        newStreak = profile.streak + 1; // Continue streak
      } else {
        newStreak = 1; // Reset streak (gap of more than 1 day)
      }
    } else {
      // No previous quest date, start streak at 1
      newStreak = 1;
    }
    
    // Check for streak badges
    if (newStreak >= 7 && !badges.includes("Week Warrior")) {
      badges.push("Week Warrior");
    }
    if (newStreak >= 30 && !badges.includes("Monthly Master")) {
      badges.push("Monthly Master");
    }

    // Update profile in database
    await updateProfile({
      xp: remainingXP,
      total_xp: newTotalXP,
      level: newLevel,
      completed_quests: profile.completed_quests + 1,
      streak: newStreak,
      badges,
      last_quest_date: today,
    });

    // Save quest progress to database
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        quest_id: quest.id,
        completed: true,
        score: Math.round(scorePercentage * 100),
        xp_earned: xpEarnedValue,
        attempts: 1,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,quest_id'
      });

    if (progressError) {
      console.error('Error saving progress:', progressError);
    }

    // Show congratulations modal
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
      {/* Header */}
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
          {/* Quest Header */}
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

          {/* Quest Content */}
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

      {/* Congratulations Modal */}
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
