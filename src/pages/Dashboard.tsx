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
import { Quest } from "@/lib/types";
import { Flame, Trophy, Target, LogOut, Award, BarChart3, MessageSquare, Swords, Sparkles, UserCog, GraduationCap, Loader2, Menu } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [recommendedQuest, setRecommendedQuest] = useState<Quest | null>(null);
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
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
          const uncompletedQuests = questsData.filter((quest: Quest) => !completed.includes(quest.id));
          if (uncompletedQuests.length > 0) {
            setRecommendedQuest(uncompletedQuests[0]);
          }

          // Mock insights
          setInsights([
            "You're doing great on Python quests! Keep it up.",
            "Consider trying an SQL quest next to broaden your skills.",
            "You have a 1-day streak! Don\'t lose it."
          ]);
        }
      }
    };

    if (user && profile) {
      loadData();
    }
  }, [user, profile]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            DataQuestAI
          </h1>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/courses')}
              className="hover:scale-105 transition-transform duration-300 hover:border-primary/50"
            >
              <GraduationCap className="h-4 w-4 mr-2" aria-hidden="true" />
              Courses
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/ai-mentor')}
              className="hover:scale-105 transition-transform duration-300 hover:border-accent/50"
            >
              <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
              AI Mentor
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/analytics')}
              className="hover:scale-105 transition-transform duration-300 hover:border-primary/50"
            >
              <BarChart3 className="h-4 w-4 mr-2" aria-hidden="true" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/forum')}
              className="hover:scale-105 transition-transform duration-300 hover:border-primary/50"
            >
              <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
              Forum
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/challenges')}
              className="hover:scale-105 transition-transform duration-300 hover:border-destructive/50"
            >
              <Swords className="h-4 w-4 mr-2" aria-hidden="true" />
              Challenges
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/leaderboard')}
              className="hover:scale-105 transition-transform duration-300 hover:border-accent/50"
            >
              <Trophy className="h-4 w-4 mr-2" aria-hidden="true" />
              Leaderboard
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              aria-label="Logout"
              className="hover:scale-105 transition-transform duration-300 hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center gap-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/courses');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Courses
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/ai-mentor');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Mentor
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/analytics');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/forum');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Forum
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/challenges');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Swords className="h-4 w-4 mr-2" />
                    Challenges
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/leaderboard');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Leaderboard
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start mt-4"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* User Stats */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-md animate-fade-in-up hover:shadow-lg transition-shadow duration-300">
          <button 
            onClick={() => navigate('/profile')}
            className="transition-transform hover:scale-110 active:scale-95 duration-300 shrink-0"
            aria-label="Edit profile"
          >
            <UserAvatar avatar={profile.avatar} username={profile.username} size="lg" showGlow />
          </button>
          <div className="flex-1 w-full space-y-3 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{profile.username}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Quest Master in Training</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/profile')} 
                className="sm:ml-auto hover:scale-105 transition-transform duration-300"
              >
                <UserCog className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>
            <XPBar currentXP={profile.xp} level={profile.level} />
            
            {/* Mobile Stats */}
            <div className="flex sm:hidden justify-center gap-6 w-full pt-2">
              <div className="text-center animate-fade-in-up delay-100">
                <div className="flex items-center justify-center gap-2 text-accent font-bold text-xl">
                  <Flame className="h-5 w-5 animate-pulse-slow" aria-hidden="true" />
                  {profile.streak}
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center animate-fade-in-up delay-200">
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-xl">
                  <Target className="h-5 w-5" aria-hidden="true" />
                  {profile.completed_quests}
                </div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center animate-fade-in-up delay-300">
                <div className="flex items-center justify-center gap-2 text-success font-bold text-xl">
                  <Award className="h-5 w-5" aria-hidden="true" />
                  {(profile.badges || []).length}
                </div>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </div>
          
          {/* Desktop Stats */}
          <div className="hidden md:flex gap-6 shrink-0">
            <div className="text-center animate-fade-in-up delay-100 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 text-accent font-bold text-2xl">
                <Flame className="h-6 w-6 animate-pulse-slow" aria-hidden="true" />
                {profile.streak}
              </div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center animate-fade-in-up delay-200 hover:scale-105 transition-transform duration-300">
              <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                <Target className="h-6 w-6" aria-hidden="true" />
                {profile.completed_quests}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center animate-fade-in-up delay-300 hover:scale-105 transition-transform duration-300">
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
          <Card className="bg-primary/5 border-primary/20 animate-fade-in-up delay-200 hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl animate-bounce-subtle" aria-hidden="true">🤖</span>
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li 
                    key={index} 
                    className="text-sm animate-fade-in-up"
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    • {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommended Quest */}
        {recommendedQuest && (
          <div className="animate-fade-in-up delay-300">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="text-2xl animate-bounce-subtle" aria-hidden="true">✨</span>
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
          <Card className="animate-fade-in-up delay-400 hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Your Badges</CardTitle>
              <CardDescription>Achievements you've unlocked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(profile.badges || []).map((badge, index) => (
                  <Badge 
                    key={badge} 
                    variant="secondary" 
                    className="text-sm px-3 py-1 hover:scale-110 transition-transform duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${500 + index * 50}ms` }}
                  >
                    🏆 {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Quests */}
        <div className="animate-fade-in-up delay-500">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">All Quests</h3>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            {quests.map((quest, index) => (
              <div
                key={quest.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <QuestCard
                  quest={quest}
                  isCompleted={completedQuestIds.includes(quest.id)}
                  onStart={handleStartQuest}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
