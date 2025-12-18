import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Medal, Award, Loader2 } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface LeaderboardUser {
  id: string;
  username: string;
  avatar: string;
  level: number;
  total_xp: number;
  completed_quests: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  const loadLeaderboard = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar, level, total_xp, completed_quests')
      .order('total_xp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading leaderboard:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-accent" aria-label="1st place" />;
      case 2:
        return <Medal className="h-6 w-6 text-muted-foreground" aria-label="2nd place" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" aria-label="3rd place" />;
      default:
        return <span className="text-muted-foreground font-semibold">#{rank}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-accent" aria-hidden="true" />
              Global Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users yet. Be the first to complete a quest!</p>
            ) : (
              <div className="space-y-3">
                {users.map((leaderboardUser, index) => (
                  <div
                    key={leaderboardUser.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      index < 3
                        ? "bg-gradient-card border-primary/30 shadow-md"
                        : "bg-card border-border hover:border-primary/30"
                    } ${leaderboardUser.id === user?.id ? "ring-2 ring-primary" : ""}`}
                  >
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <UserAvatar 
                      avatar={leaderboardUser.avatar} 
                      username={leaderboardUser.username}
                      size={index < 3 ? "lg" : "md"}
                      rank={index + 1}
                      showGlow={index < 3}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {leaderboardUser.username}
                        {leaderboardUser.id === user?.id && (
                          <span className="text-xs text-primary ml-2">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Level {leaderboardUser.level} • {leaderboardUser.completed_quests} quests completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-primary">
                        {leaderboardUser.total_xp.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Total XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
