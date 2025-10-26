import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/lib/types";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/data/sampleUsers.json')
      .then(res => res.json())
      .then(data => {
        // Sort by totalXP
        const sorted = [...data].sort((a, b) => b.totalXP - a.totalXP);
        setUsers(sorted);
      });
  }, []);

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
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-accent" aria-hidden="true" />
              Global Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    index < 3
                      ? "bg-gradient-card border-primary/30 shadow-md"
                      : "bg-card border-border hover:border-primary/30"
                  }`}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="text-4xl" role="img" aria-label={`${user.username}'s avatar`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{user.username}</h3>
                    <p className="text-sm text-muted-foreground">
                      Level {user.level} • {user.completedQuests} quests completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-primary">
                      {user.totalXP.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total XP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Leaderboard;
