import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, Target, Award, Clock, BarChart3, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserProgressData {
  quest_id: string;
  completed: boolean;
  score: number;
  xp_earned: number;
  attempts: number;
  time_spent: number;
  completed_at: string | null;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [progress, setProgress] = useState<UserProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    perfectScores: 0,
    improvementRate: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading progress:', error);
      setLoading(false);
      return;
    }

    const userProgress = data || [];
    setProgress(userProgress);

    // Calculate stats
    const completed = userProgress.filter(p => p.completed);
    const totalAttempts = completed.reduce((sum, p) => sum + (p.attempts || 1), 0);
    const averageScore = completed.length > 0 
      ? completed.reduce((sum, p) => sum + p.score, 0) / completed.length 
      : 0;
    const totalTimeSpent = completed.reduce((sum, p) => sum + (p.time_spent || 0), 0);
    const perfectScores = completed.filter(p => p.score === 100).length;
    
    // Calculate improvement rate
    const sorted = [...completed].sort((a, b) => 
      new Date(a.completed_at || '').getTime() - new Date(b.completed_at || '').getTime()
    );
    const halfPoint = Math.floor(sorted.length / 2);
    const olderAvg = sorted.slice(0, halfPoint).reduce((sum, p) => sum + p.score, 0) / (halfPoint || 1);
    const recentAvg = sorted.slice(halfPoint).reduce((sum, p) => sum + p.score, 0) / (sorted.length - halfPoint || 1);
    const improvementRate = recentAvg - olderAvg;

    setStats({
      totalAttempts,
      averageScore,
      totalTimeSpent,
      perfectScores,
      improvementRate,
    });

    setLoading(false);
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const completedQuests = progress.filter(p => p.completed);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Performance Analytics
          </h1>
          <p className="text-muted-foreground">Track your learning progress and insights</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.averageScore.toFixed(1)}%</div>
              <Progress value={stats.averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Across {completedQuests.length} quests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perfect Scores</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.perfectScores}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {completedQuests.length > 0 
                  ? `${((stats.perfectScores / completedQuests.length) * 100).toFixed(0)}% of quests` 
                  : 'Complete quests to see stats'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.floor(stats.totalTimeSpent / 60)}h</div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalTimeSpent} minutes total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Improvement Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.improvementRate >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.improvementRate >= 0 ? '+' : ''}{stats.improvementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recent vs. earlier performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{profile.total_xp}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Level {profile.level} achieved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest completed quests</CardDescription>
          </CardHeader>
          <CardContent>
            {completedQuests.length > 0 ? (
              <div className="space-y-3">
                {completedQuests
                  .sort((a, b) => new Date(b.completed_at || '').getTime() - new Date(a.completed_at || '').getTime())
                  .slice(0, 5)
                  .map((quest) => (
                    <div key={quest.quest_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Quest: {quest.quest_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {quest.completed_at ? new Date(quest.completed_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{quest.score}%</p>
                        <p className="text-xs text-muted-foreground">+{quest.xp_earned} XP</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No completed quests yet. Start a quest to see your progress!</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
