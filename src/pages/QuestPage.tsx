import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import QuizView from "@/components/QuizView";
import CodeEditor from "@/components/CodeEditor";
import { storage } from "@/lib/storage";
import { Quest, User } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const QuestPage = () => {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setUser(currentUser);

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
      });
  }, [questId, navigate]);

  const handleQuestComplete = (score: number) => {
    if (!quest || !user) return;

    // Calculate XP earned based on score
    const totalQuestions = quest.questions?.length || 1;
    const scorePercentage = score / totalQuestions;
    const xpEarned = Math.round(quest.xpReward * scorePercentage);

    // Update user
    const updatedUser = {
      ...user,
      xp: user.xp + xpEarned,
      totalXP: user.totalXP + xpEarned,
      completedQuests: user.completedQuests + 1,
      level: Math.floor((user.totalXP + xpEarned) / 200) + 1,
    };

    // Award badges
    if (updatedUser.completedQuests === 1 && !updatedUser.badges.includes("First Quest")) {
      updatedUser.badges.push("First Quest");
    }
    if (scorePercentage === 1 && !updatedUser.badges.includes("Perfect Score")) {
      updatedUser.badges.push("Perfect Score");
    }

    storage.setCurrentUser(updatedUser);

    // Save progress
    storage.saveQuestProgress({
      questId: quest.id,
      completed: true,
      score,
      xpEarned,
      completedAt: new Date().toISOString(),
    });

    toast.success(`Quest completed! +${xpEarned} XP`, {
      description: scorePercentage === 1 ? "Perfect score! 🎉" : "Great job!",
    });

    setTimeout(() => navigate('/dashboard'), 2000);
  };

  if (!quest || !user) {
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
