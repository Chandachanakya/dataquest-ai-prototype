import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import XPBar from "@/components/XPBar";
import QuestCard from "@/components/QuestCard";
import { storage } from "@/lib/storage";
import { aiEngine } from "@/lib/ai";
import { User, Quest } from "@/lib/types";
import { Flame, Trophy, Target, LogOut, Award, BarChart3, MessageSquare, Swords } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recommendedQuest, setRecommendedQuest] = useState<Quest | null>(null);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    setUser(currentUser);

    // Load quests
    fetch('/data/sampleQuests.json')
      .then(res => res.json())
      .then(data => {
        setQuests(data);
        
        // Get completed quests
        const progress = storage.getUserProgress();
        const completed = progress.filter(p => p.completed).map(p => p.questId);
        setCompletedQuestIds(completed);

        // Get AI recommendation
        const recommended = aiEngine.recommendNextQuest(currentUser, data, completed);
        setRecommendedQuest(recommended);
      });
  }, [navigate]);

  const handleStartQuest = (questId: string) => {
    navigate(`/quest/${questId}`);
  };

  const handleLogout = () => {
    storage.clearCurrentUser();
    toast.success("Logged out successfully");
    navigate('/');
  };

  if (!user) return null;

  const insights = aiEngine.generateInsights(user);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            DataQuestAI
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
              Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/forum')}>
              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
              Forum
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/challenges')}>
              <Swords className="h-4 w-4 mr-2" aria-hidden="true" />
              Challenges
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')}>
              <Trophy className="h-4 w-4 mr-2" aria-hidden="true" />
              Leaderboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* User Stats */}
        <div className="flex items-center gap-6 bg-card border border-border p-6 rounded-2xl shadow-md">
          <div className="text-6xl" role="img" aria-label={`Avatar ${user.avatar}`}>
            {user.avatar}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-3xl font-bold text-foreground">{user.username}</h2>
              <p className="text-muted-foreground">Quest Master in Training</p>
            </div>
            <XPBar currentXP={user.xp} level={user.level} />
          </div>
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-accent font-bold text-2xl">
                <Flame className="h-6 w-6" aria-hidden="true" />
                {user.streak}
              </div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                <Target className="h-6 w-6" aria-hidden="true" />
                {user.completedQuests}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-success font-bold text-2xl">
                <Award className="h-6 w-6" aria-hidden="true" />
                {user.badges.length}
              </div>
              <p className="text-sm text-muted-foreground">Badges</p>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {insights.length > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">🤖</span>
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="text-sm">• {insight}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommended Quest */}
        {recommendedQuest && (
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">✨</span>
              Recommended for You
            </h3>
            <QuestCard
              quest={recommendedQuest}
              isCompleted={completedQuestIds.includes(recommendedQuest.id)}
              onStart={handleStartQuest}
            />
          </div>
        )}

        {/* Badges */}
        {user.badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>Achievements you've unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-sm px-3 py-1">
                    🏆 {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Quests */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-4">All Quests</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isCompleted={completedQuestIds.includes(quest.id)}
                onStart={handleStartQuest}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
