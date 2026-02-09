import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, TrendingUp, Target, Award, Clock, BarChart3, Loader2, HelpCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UserProgressData {
  quest_id: string;
  completed: boolean;
  score: number;
  xp_earned: number;
  attempts: number;
  time_spent: number;
  completed_at: string | null;
}

interface DecisionLog {
  id: string;
  state_detected: string;
  action_taken: string;
  reason: string;
  timestamp: string;
  metadata: any;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [progress, setProgress] = useState<UserProgressData[]>([]);
  const [decisionLogs, setDecisionLogs] = useState<DecisionLog[]>([]);
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

    // Load decision logs
    const { data: logsData } = await supabase
      .from('decision_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10);

    setDecisionLogs(logsData || []);

    // Calculate stats from user_progress
    const completed = userProgress.filter(p => p.completed);
    const totalAttempts = completed.reduce((sum, p) => sum + (p.attempts || 1), 0);
    const averageScore = completed.length > 0
      ? Math.min(100, completed.reduce((sum, p) => sum + p.score, 0) / completed.length) // Cap at 100%
      : 0;
    const perfectScores = completed.filter(p => p.score === 100).length;

    // Get time data from quest_attempts table (completion_time is in seconds)
    const { data: attemptsData } = await supabase
      .from('quest_attempts')
      .select('completion_time')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .not('completion_time', 'is', null);

    const totalTimeSpent = attemptsData?.reduce((sum, a) => sum + (a.completion_time || 0), 0) || 0;
    const completedAttemptsCount = attemptsData?.length || completed.length; // Fallback to completed quests count

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
      totalTimeSpent, // in seconds
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Learning Score (0-100)</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Your average quiz score across all completed quests. Used to determine if you need additional support or advanced challenges.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.averageScore.toFixed(1)}%</div>
              <Progress value={stats.averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Quest Attempts</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Total number of quest attempts. Multiple attempts on the same quest indicate persistence and learning.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Avg Time per Quest</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Average time spent per quest. Tracked from quest start to completion. Helps identify learning efficiency.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.totalTimeSpent > 0 && completedQuests.length > 0
                  ? `${Math.floor(stats.totalTimeSpent / completedQuests.length / 60)}m`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalTimeSpent > 0
                  ? `${Math.floor(stats.totalTimeSpent / 60)} minutes total`
                  : 'Complete new quests to track time'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Learning Trend</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Compares your recent performance to earlier attempts. Positive values indicate improvement over time.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Engagement XP</CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Total experience points earned from completing quests. Reflects your overall engagement and progress.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
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

        {/* Decision Logs - Proof of Personalization */}
        <Card>
          <CardHeader>
            <CardTitle>🤖 AI Personalization History</CardTitle>
            <CardDescription>System decisions and actions taken based on your learning patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {decisionLogs.length > 0 ? (
              <div className="space-y-3">
                {decisionLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${log.state_detected === 'STRUGGLING' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' :
                          log.state_detected === 'FAST' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                            log.state_detected === 'DROP_RISK' ? 'bg-red-500/20 text-red-700 dark:text-red-300' :
                              'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                          }`}>
                          {log.state_detected}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-1">Action: {log.action_taken.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No personalization actions yet. Complete more quests to see AI-driven recommendations!</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
