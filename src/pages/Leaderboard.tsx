import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trophy, Medal, Award, Loader2, Crown, TrendingUp, Zap } from "lucide-react";
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
        return (
          <div className="relative">
            <Crown className="h-8 w-8 text-accent animate-bounce-subtle" aria-label="1st place" />
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-lg animate-pulse-slow" />
          </div>
        );
      case 2:
        return (
          <div className="relative">
            <Medal className="h-7 w-7 text-muted-foreground" aria-label="2nd place" />
          </div>
        );
      case 3:
        return (
          <div className="relative">
            <Award className="h-7 w-7 text-amber-600" aria-label="3rd place" />
          </div>
        );
      default:
        return (
          <span className="text-muted-foreground font-bold text-lg">
            #{rank}
          </span>
        );
    }
  };

  const getRankGradient = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-accent/20 via-accent/10 to-transparent";
      case 2:
        return "from-muted/30 via-muted/15 to-transparent";
      case 3:
        return "from-amber-600/20 via-amber-600/10 to-transparent";
      default:
        return "";
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

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-fade-in-up">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="relative">
                  <Trophy className="h-10 w-10 sm:h-12 sm:w-12 text-accent animate-bounce-subtle" aria-hidden="true" />
                  <div className="absolute inset-0 bg-accent/30 rounded-full blur-xl animate-pulse-slow" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Global Leaderboard
                </CardTitle>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Top performers in the DataQuestAI community
              </p>
            </CardHeader>
          </Card>

          {/* Top 3 Podium */}
          {users.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 animate-fade-in-up delay-100">
              {/* 2nd Place */}
              <div className="order-2 sm:order-1 flex flex-col items-center animate-fade-in-up delay-200">
                <div className="relative mb-3">
                  <div className={`absolute inset-0 bg-gradient-to-b ${getRankGradient(2)} rounded-full blur-md`} />
                  <UserAvatar 
                    avatar={users[1].avatar} 
                    username={users[1].username}
                    size="lg"
                    showGlow
                  />
                  <div className="absolute -top-2 -right-2">
                    <Medal className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-center w-full bg-gradient-to-b from-muted/50 to-card rounded-xl p-3 border-2 border-border/50">
                  <p className="font-bold text-sm truncate">{users[1].username}</p>
                  <p className="text-xs text-muted-foreground">Level {users[1].level}</p>
                  <p className="text-xs font-semibold text-primary mt-1">{users[1].total_xp.toLocaleString()} XP</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 sm:order-2 flex flex-col items-center animate-scale-in delay-300">
                <div className="relative mb-3">
                  <div className={`absolute inset-0 bg-gradient-to-b ${getRankGradient(1)} rounded-full blur-xl animate-pulse-slow`} />
                  <UserAvatar 
                    avatar={users[0].avatar} 
                    username={users[0].username}
                    size="xl"
                    showGlow
                  />
                  <div className="absolute -top-2 -right-2">
                    <Crown className="h-6 w-6 text-accent animate-bounce-subtle" />
                  </div>
                </div>
                <div className="text-center w-full bg-gradient-to-b from-accent/30 via-accent/20 to-card rounded-xl p-3 sm:p-4 border-2 border-accent/50 shadow-lg">
                  <Badge variant="outline" className="mb-1 border-accent/50 text-accent">🏆 Champion</Badge>
                  <p className="font-bold text-sm truncate">{users[0].username}</p>
                  <p className="text-xs text-muted-foreground">Level {users[0].level}</p>
                  <p className="text-sm font-bold text-accent mt-1">{users[0].total_xp.toLocaleString()} XP</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 flex flex-col items-center animate-fade-in-up delay-200">
                <div className="relative mb-3">
                  <div className={`absolute inset-0 bg-gradient-to-b ${getRankGradient(3)} rounded-full blur-md`} />
                  <UserAvatar 
                    avatar={users[2].avatar} 
                    username={users[2].username}
                    size="lg"
                    showGlow
                  />
                  <div className="absolute -top-2 -right-2">
                    <Award className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                <div className="text-center w-full bg-gradient-to-b from-amber-600/20 to-card rounded-xl p-3 border-2 border-amber-600/30">
                  <p className="font-bold text-sm truncate">{users[2].username}</p>
                  <p className="text-xs text-muted-foreground">Level {users[2].level}</p>
                  <p className="text-xs font-semibold text-amber-600 mt-1">{users[2].total_xp.toLocaleString()} XP</p>
                </div>
              </div>
            </div>
          )}

          {/* Rest of Leaderboard */}
          <Card className="border-2 border-border animate-fade-in-up delay-400">
            <CardContent className="p-4 sm:p-6">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-lg">No users yet. Be the first to complete a quest!</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {users.slice(users.length >= 3 ? 3 : 0).map((leaderboardUser, index) => {
                    const rank = index + (users.length >= 3 ? 4 : 1);
                    const isCurrentUser = leaderboardUser.id === user?.id;
                    return (
                      <div
                        key={leaderboardUser.id}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md hover-lift ${
                          isCurrentUser
                            ? "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-primary/50 ring-2 ring-primary/30"
                            : "bg-card border-border hover:border-primary/30"
                        } animate-fade-in-up`}
                        style={{ animationDelay: `${500 + index * 50}ms` }}
                      >
                        <div className="w-10 sm:w-12 flex items-center justify-center shrink-0">
                          {getRankIcon(rank)}
                        </div>
                        <UserAvatar 
                          avatar={leaderboardUser.avatar} 
                          username={leaderboardUser.username}
                          size="md"
                          showGlow={isCurrentUser}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base sm:text-lg truncate">
                              {leaderboardUser.username}
                            </h3>
                            {isCurrentUser && (
                              <Badge variant="default" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Level {leaderboardUser.level}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {leaderboardUser.completed_quests} quests
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-lg sm:text-xl text-primary">
                            {leaderboardUser.total_xp.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
