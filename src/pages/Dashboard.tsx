import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import XPBar from "@/components/XPBar";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { aiEngine } from "@/lib/ai";
import { Quest } from "@/lib/types";
import { Flame, Trophy, Target, LogOut, Award, BarChart3, MessageSquare, Swords, Sparkles, UserCog, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recommendedQuest, setRecommendedQuest] = useState<Quest | null>(null);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      loadData();
    }
  }, [user, profile]);

  const loadData = async () => {
    // Load quests from JSON
    const questsRes = await fetch('/data/sampleQuests.json');
    const questsData = await questsRes.json();
    setQuests(questsData);

    // Load completed quests from database
    if (user) {
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('quest_id')
        .eq('user_id', user.id)
        .eq('completed', true);

      const completed = progressData?.map(p => p.quest_id) || [];
      setCompletedQuestIds(completed);

      // Get AI recommendation using profile preferences
      if (profile) {
        const userForAI = {
          id: user.id,
          username: profile.username,
          avatar: profile.avatar,
          level: profile.level,
          xp: profile.xp,
          totalXP: profile.total_xp,
          streak: profile.streak,
          badges: profile.badges || [],
          completedQuests: profile.completed_quests,
          preferences: {
            learningStyle: profile.learning_style,
            difficulty: profile.difficulty,
            topics: profile.topics || [],
          },
        };
        const recommended = aiEngine.recommendNextQuest(userForAI, questsData, completed);
        setRecommendedQuest(recommended);
      }
    }
  };

  const handleStartQuest = (questId: string) => {
    navigate(`/quest/${questId}`);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate('/');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const userForInsights = {
    id: user.id,
    username: profile.username,
    avatar: profile.avatar,
    level: profile.level,
    xp: profile.xp,
    totalXP: profile.total_xp,
    streak: profile.streak,
    badges: profile.badges || [],
    completedQuests: profile.completed_quests,
    preferences: {
      learningStyle: profile.learning_style,
      difficulty: profile.difficulty,
      topics: profile.topics || [],
    },
  };

  const insights = aiEngine.generateInsights(userForInsights);

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
            <Button variant="outline" size="sm" onClick={() => navigate('/courses')}>
              <GraduationCap className="h-4 w-4 mr-2" aria-hidden="true" />
              Courses
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/ai-mentor')}>
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              AI Mentor
            </Button>
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
          <button 
            onClick={() => navigate('/profile')}
            className="transition-transform hover:scale-105"
            aria-label="Edit profile"
          >
            <UserAvatar avatar={profile.avatar} username={profile.username} size="lg" showGlow />
          </button>
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{profile.username}</h2>
                <p className="text-muted-foreground">Quest Master in Training</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="ml-auto">
                <UserCog className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            </div>
            <XPBar currentXP={profile.xp} level={profile.level} />
          </div>
          <div className="hidden md:flex gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-accent font-bold text-2xl">
                <Flame className="h-6 w-6" aria-hidden="true" />
                {profile.streak}
              </div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                <Target className="h-6 w-6" aria-hidden="true" />
                {profile.completed_quests}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-success font-bold text-2xl">
                <Award className="h-6 w-6" aria-hidden="true" />
                {(profile.badges || []).length}
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
        {(profile.badges || []).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>Achievements you've unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.badges || []).map((badge) => (
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
