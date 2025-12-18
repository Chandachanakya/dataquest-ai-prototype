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

const QuestPage = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [questLoading, setQuestLoading] = useState(true);

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
    const xpEarned = Math.round(quest.xpReward * scorePercentage);

    // Calculate new values
    const newTotalXP = profile.total_xp + xpEarned;
    const newXP = profile.xp + xpEarned;
    const xpPerLevel = 1000;
    let newLevel = profile.level;
    let remainingXP = newXP;

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

    // Update streak (increment by 1 on quest completion)
    const newStreak = profile.streak + 1;
    
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
    });

    // Save quest progress to database
    const { error: progressError } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        quest_id: quest.id,
        completed: true,
        score: Math.round(scorePercentage * 100),
        xp_earned: xpEarned,
        attempts: 1,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,quest_id'
      });

    if (progressError) {
      console.error('Error saving progress:', progressError);
    }

    toast.success(`Quest completed! +${xpEarned} XP`, {
      description: scorePercentage === 1 ? "Perfect score! 🎉" : "Great job!",
    });

    setTimeout(() => navigate('/dashboard'), 2000);
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

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Quest Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">{quest.title}</h1>
            <p className="text-lg text-muted-foreground">{quest.description}</p>
            <div className="flex items-center justify-center gap-3">
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
    </div>
  );
};

export default QuestPage;
