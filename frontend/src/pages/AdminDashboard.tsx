import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LogOut, Users, Activity, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const AdminDashboard = () => {
  const { stats, loading } = useAdminStats();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/signin");
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Aggregating Global Impact Metrics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Impact Measurement Dashboard
            </h1>
            <p className="text-muted-foreground">Live Telemetry & ML Effectiveness</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> End Admin Session
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Globally Registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active (7 Days)</CardTitle>
              <Activity className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalActive7D}</div>
              <p className="text-xs text-muted-foreground mt-1">Users active this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Global Day 7 Retention</CardTitle>
              <Target className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.retained7D.percentage.toFixed(1)}%</div>
              <Progress value={stats.retained7D.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.retained7D.count} users passed day 7</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Global Day 14 Retention</CardTitle>
              <Target className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-500">{stats.retained14D.percentage.toFixed(1)}%</div>
              <Progress value={stats.retained14D.percentage} className="mt-2 bg-indigo-500/20" />
              <p className="text-xs text-muted-foreground mt-1">{stats.retained14D.count} users passed day 14</p>
            </CardContent>
          </Card>
        </div>

        {/* A/B Test Results */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              A/B Test Evaluation: ML vs Heuristics
            </CardTitle>
            <CardDescription>
              Comparing Day 7 Retention explicitly between users in the Treatment (ML) group vs Control (Heuristic Thresholds).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2 p-6 rounded-lg bg-card border border-border">
                <h3 className="text-lg font-semibold text-primary">Treatment (ML Engine)</h3>
                <div className="flex justify-between items-end pb-4">
                  <span className="text-4xl font-black">{stats.abTest.mlGroup.retention7dRate.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">n={stats.abTest.mlGroup.size}</span>
                </div>
                <Progress value={stats.abTest.mlGroup.retention7dRate} />
              </div>
              <div className="space-y-2 p-6 rounded-lg bg-muted/50 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground">Control (Heuristic Logic)</h3>
                <div className="flex justify-between items-end pb-4">
                  <span className="text-4xl font-bold">{stats.abTest.heuristicGroup.retention7dRate.toFixed(1)}%</span>
                  <span className="text-sm text-muted-foreground">n={stats.abTest.heuristicGroup.size}</span>
                </div>
                <Progress value={stats.abTest.heuristicGroup.retention7dRate} className="bg-muted-foreground/20 [&>div]:bg-muted-foreground" />
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm font-medium">
                Absolute Uplift: <span className="text-emerald-500">{
                  Math.max(0, stats.abTest.mlGroup.retention7dRate - stats.abTest.heuristicGroup.retention7dRate).toFixed(1)
                }%</span>
            </div>
          </CardContent>
        </Card>

        {/* Intervention Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Intervention Outcomes Tracking</CardTitle>
            <CardDescription>
              Telemetry aggregated from 24-hr trailing periods. Essential training data for the next-gen Recommendation Model.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.interventions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-md">
                    <tr>
                      <th className="px-4 py-3 rounded-l-md">Intervention Strategy</th>
                      <th className="px-4 py-3">Times Triggered</th>
                      <th className="px-4 py-3">Acceptance Rate</th>
                      <th className="px-4 py-3 rounded-r-md">Avg XP Impact (24h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.interventions.map((inv, idx) => (
                      <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 font-medium">{inv.case.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-4">{inv.totalTriggered}</td>
                        <td className="px-4 py-4 text-primary">
                          {inv.acceptanceRate.toFixed(1)}%
                        </td>
                        <td className={`px-4 py-4 font-semibold ${inv.avgXpChange > 0 ? 'text-emerald-500' : ''}`}>
                          {inv.avgXpChange > 0 ? '+' : ''}{inv.avgXpChange.toFixed(0)} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                No interventions have yielded 24-hour trailing data yet.
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default AdminDashboard;
