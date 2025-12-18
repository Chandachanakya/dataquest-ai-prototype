import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { storage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { Challenge, Quest } from "@/lib/types";
import { ArrowLeft, Swords, Trophy, Users, Plus, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Challenges = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, { completed: boolean; score: number }>>({});
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");
  const [newChallengeDescription, setNewChallengeDescription] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [targetScore, setTargetScore] = useState(80);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadChallenges();
      loadQuests();
      loadUserProgress();
    }
  }, [user]);

  const loadQuests = async () => {
    const res = await fetch('/data/sampleQuests.json');
    const data = await res.json();
    setQuests(data);
  };

  const loadUserProgress = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_progress')
      .select('quest_id, completed, score')
      .eq('user_id', user.id);

    const progressMap: Record<string, { completed: boolean; score: number }> = {};
    data?.forEach(p => {
      progressMap[p.quest_id] = { completed: p.completed, score: p.score };
    });
    setUserProgress(progressMap);
  };

  const loadChallenges = () => {
    const allChallenges = storage.getChallenges();
    const active = allChallenges.filter(c => new Date(c.expiresAt) > new Date());
    setChallenges(active);
  };

  const handleCreateChallenge = () => {
    if (!user || !profile || !newChallengeTitle.trim() || !selectedQuestId) {
      toast.error("Please fill in all fields");
      return;
    }

    const challenge: Challenge = {
      id: `challenge-${Date.now()}`,
      title: newChallengeTitle,
      description: newChallengeDescription,
      questId: selectedQuestId,
      creatorId: user.id,
      creatorName: profile.username,
      targetScore,
      participants: [{
        userId: user.id,
        username: profile.username,
        avatar: profile.avatar,
      }],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    storage.saveChallenge(challenge);
    loadChallenges();
    setNewChallengeTitle("");
    setNewChallengeDescription("");
    setSelectedQuestId("");
    setTargetScore(80);
    setNewChallengeOpen(false);
    toast.success("Challenge created!");
  };

  const handleJoinChallenge = (challengeId: string) => {
    if (!user || !profile) return;

    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    if (challenge.participants.some(p => p.userId === user.id)) {
      toast.info("You're already in this challenge");
      return;
    }

    const updatedParticipants = [
      ...challenge.participants,
      {
        userId: user.id,
        username: profile.username,
        avatar: profile.avatar,
      }
    ];

    storage.updateChallenge(challengeId, { participants: updatedParticipants });
    loadChallenges();
    toast.success("Joined challenge! Complete the quest to submit your score.");
  };

  const handleStartQuest = (questId: string) => {
    navigate(`/quest/${questId}`);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Peer Challenges
              </h1>
              <p className="text-muted-foreground">Compete with other learners</p>
            </div>
            <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Challenge</DialogTitle>
                  <DialogDescription>Challenge others to beat your score</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Challenge title"
                    value={newChallengeTitle}
                    onChange={(e) => setNewChallengeTitle(e.target.value)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    value={newChallengeDescription}
                    onChange={(e) => setNewChallengeDescription(e.target.value)}
                  />
                  <select
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={selectedQuestId}
                    onChange={(e) => setSelectedQuestId(e.target.value)}
                  >
                    <option value="">Select a quest</option>
                    {quests.map(quest => (
                      <option key={quest.id} value={quest.id}>
                        {quest.title} ({quest.difficulty})
                      </option>
                    ))}
                  </select>
                  <div>
                    <label className="text-sm font-medium">Target Score: {targetScore}%</label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleCreateChallenge} className="w-full">
                    Create Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {challenges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
              <p className="text-muted-foreground mb-4">Create a challenge to compete with others!</p>
              <Button onClick={() => setNewChallengeOpen(true)}>Create First Challenge</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {challenges.map((challenge) => {
              const quest = quests.find(q => q.id === challenge.questId);
              const isParticipant = challenge.participants.some(p => p.userId === user.id);
              const questProgress = userProgress[challenge.questId];
              const hasCompleted = questProgress?.completed;

              return (
                <Card key={challenge.id} className="relative overflow-hidden">
                  {isParticipant && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
                      Participating
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      </div>
                    </div>
                    <CardDescription>{challenge.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Created by:</span>
                      <span className="font-medium">{challenge.creatorName}</span>
                    </div>

                    {quest && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="font-medium text-sm mb-1">{quest.title}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{quest.difficulty}</Badge>
                          <Badge variant="outline">{quest.topic}</Badge>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          Target Score
                        </p>
                        <p className="font-bold text-lg text-primary">{challenge.targetScore}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Participants
                        </p>
                        <p className="font-bold text-lg">{challenge.participants.length}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Ends in {getTimeRemaining(challenge.expiresAt)}</span>
                    </div>

                    {hasCompleted && questProgress && (
                      <div className="bg-success/10 border border-success/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-success">Your Score: {questProgress.score}%</p>
                        {questProgress.score >= challenge.targetScore ? (
                          <p className="text-xs text-muted-foreground">🎉 Target achieved!</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Keep trying to beat the target!</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!isParticipant && (
                        <Button
                          variant="outline"
                          onClick={() => handleJoinChallenge(challenge.id)}
                          className="flex-1"
                        >
                          Join Challenge
                        </Button>
                      )}
                      <Button
                        onClick={() => handleStartQuest(challenge.questId)}
                        className="flex-1"
                        disabled={!quest}
                      >
                        {hasCompleted ? 'Retry Quest' : 'Start Quest'}
                      </Button>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">PARTICIPANTS</p>
                      <div className="flex flex-wrap gap-2">
                        {challenge.participants.slice(0, 5).map((participant) => (
                          <div
                            key={participant.userId}
                            className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full"
                            title={participant.username}
                          >
                            <span className="text-sm">{participant.avatar}</span>
                            <span className="text-xs">{participant.username}</span>
                          </div>
                        ))}
                        {challenge.participants.length > 5 && (
                          <div className="flex items-center px-2 py-1 text-xs text-muted-foreground">
                            +{challenge.participants.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Challenges;
