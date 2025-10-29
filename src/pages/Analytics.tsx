import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { User, UserProgress } from "@/lib/types";
import { ArrowLeft, TrendingUp, Target, Award, Clock, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Analytics = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    perfectScores: 0,
    improvementRate: 0,
  });

  useEffect(() => {
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }

    setUser(currentUser);
    const userProgress = storage.getUserProgress();
    setProgress(userProgress);

    // Calculate stats
    const completed = userProgress.filter(p => p.completed);
    const totalAttempts = completed.reduce((sum, p) => sum + (p.attempts || 1), 0);
    const averageScore = completed.length > 0 
      ? completed.reduce((sum, p) => sum + p.score, 0) / completed.length 
      : 0;
    const totalTimeSpent = completed.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const perfectScores = completed.filter(p => p.score === 100).length;
    
    // Calculate improvement rate (compare recent vs older scores)
    const sorted = [...completed].sort((a, b) => 
      new Date(a.completedAt || '').getTime() - new Date(b.completedAt || '').getTime()
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
  }, [navigate]);

  if (!user) return null;

  const completedQuests = progress.filter(p => p.completed);
  const topicBreakdown = completedQuests.reduce((acc, p) => {
    // This would ideally get topic from quest data
    const topic = 'Data Science'; // Simplified
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <div className="text-3xl font-bold text-primary">{user.totalXP}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Level {user.level} achieved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Topic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Focus</CardTitle>
            <CardDescription>Quests completed by topic</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(topicBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(topicBreakdown).map(([topic, count]) => (
                  <div key={topic}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{topic}</span>
                      <span className="text-sm text-muted-foreground">{count} quests</span>
                    </div>
                    <Progress value={(count / completedQuests.length) * 100} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Complete quests to see your learning focus</p>
            )}
          </CardContent>
        </Card>

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
                  .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
                  .slice(0, 5)
                  .map((quest) => (
                    <div key={quest.questId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Quest ID: {quest.questId}</p>
                        <p className="text-sm text-muted-foreground">
                          {quest.completedAt ? new Date(quest.completedAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{quest.score}%</p>
                        <p className="text-xs text-muted-foreground">+{quest.xpEarned} XP</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No completed quests yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
