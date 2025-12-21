
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Quest } from "@/lib/types";
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

type ChallengeParticipant = Tables<'challenge_participants'> & { profiles: { username: string, avatar: string } };
type Challenge = Tables<'challenges'> & { challenge_participants: ChallengeParticipant[] };

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
  const [loading, setLoading] = useState(true);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

  useEffect(() => {
    loadInitialData();

    const changes = supabase.channel('table-db-changes')
      .on<Tables<'challenges'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        (payload) => {
          console.log('Challenge change received!', payload)
          loadChallenges();
        }
      )
      .on<Tables<'challenge_participants'>>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenge_participants' },
        (payload) => {
          console.log('Participant change received!', payload)
          loadChallenges();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(changes)
    };
  }, []);

  useEffect(() => {
    if(user) {
      loadUserProgress(user.id);
    }
  }, [user]);
  
  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      loadQuests(),
      loadChallenges(),
      user && loadUserProgress(user.id),
    ]);
    setLoading(false);
  };

  const loadQuests = async () => {
    const res = await fetch('/data/sampleQuests.json');
    const data = await res.json();
    setQuests(data);
  };

  const loadUserProgress = async (userId: string) => {
    const { data } = await supabase
      .from('user_progress')
      .select('quest_id, completed, score')
      .eq('user_id', userId);

    const progressMap: Record<string, { completed: boolean; score: number }> = {};
    data?.forEach(p => {
      progressMap[p.quest_id] = { completed: p.completed ?? false, score: p.score ?? 0 };
    });
    setUserProgress(progressMap);
  };

  const loadChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenge_participants (*, profiles(username, avatar))
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Failed to load challenges.");
      console.error(error);
    } else {
      setChallenges(data as any);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user || !profile) {
      toast.error("Please log in to create a challenge");
      return;
    }
    if (newChallengeTitle.trim().length <= 10) {
      toast.error("Challenge title must be longer than 10 characters.");
      return;
    }
    if (!selectedQuestId) {
      toast.error("Please select a quest for the challenge.");
      return;
    }
    if (targetScore <= 0) {
        toast.error("Target score must be greater than 0.");
        return;
    }

    setIsCreatingChallenge(true);
    try {
      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          title: newChallengeTitle,
          description: newChallengeDescription,
          quest_id: selectedQuestId,
          creator_id: user.id,
          creator_name: profile.username,
          target_score: targetScore,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error || !challenge) throw error;
      
      const { error: participantError } = await supabase.from('challenge_participants').insert({
        challenge_id: challenge.id,
        user_id: user.id,
        username: profile.username,
        avatar: profile.avatar,
      });

      if (participantError) throw participantError;

      setNewChallengeTitle("");
      setNewChallengeDescription("");
      setSelectedQuestId("");
      setTargetScore(80);
      setNewChallengeOpen(false);
      toast.success("Challenge created!");

    } catch (error: any) {
      toast.error("Failed to create challenge.", {
        description: error.message || "Please check the details and try again."
      });
      console.error("Failed to create challenge:", error);
    } finally {
      setIsCreatingChallenge(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user || !profile) {
      toast.error("You must be logged in to join a challenge.");
      return;
    }

    const { error } = await supabase.from('challenge_participants').insert({
      challenge_id: challengeId,
      user_id: user.id,
      username: profile.username,
      avatar: profile.avatar,
    });

    if (error) {
      if(error.code === '23505') { // unique constraint violation
        toast.info("You are already in this challenge.");
      } else {
        toast.error("Failed to join challenge.");
        console.error(error);
      }
    } else {
      toast.success("Joined challenge! Complete the quest to submit your score.");
    }
  };
  
  const handleUpdateParticipantScore = async (questId: string, score: number) => {
    if (!user) return;
    
    const relevantChallenges = challenges.filter(c => c.quest_id === questId && c.challenge_participants.some(p => p.user_id === user.id));

    for (const challenge of relevantChallenges) {
       const { error } = await supabase
        .from('challenge_participants')
        .update({ score, completed_at: new Date().toISOString() })
        .eq('challenge_id', challenge.id)
        .eq('user_id', user.id);

        if (error) {
          toast.error("Failed to update your score for a challenge.");
          console.error(error);
        }
    }
  };

  useEffect(() => {
    // When user's quest progress changes, update their score in any relevant challenges
    if (user && Object.keys(userProgress).length > 0) {
      for (const [questId, progress] of Object.entries(userProgress)) {
        if (progress.completed) {
          handleUpdateParticipantScore(questId, progress.score);
        }
      }
    }
  }, [userProgress]); // Reruns when userProgress is updated

  const handleStartQuest = (questId: string) => {
    navigate(`/quest/${questId}`);
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  const isFormValid = newChallengeTitle.trim().length > 10 && selectedQuestId && targetScore > 0;

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
            {user && (
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
                  <div>
                    <Input
                      placeholder="Challenge title (e.g., Python Expert Challenge)"
                      value={newChallengeTitle}
                      onChange={(e) => setNewChallengeTitle(e.target.value)}
                    />
                    {newChallengeTitle.trim().length > 0 && newChallengeTitle.trim().length <= 10 && (
                        <p className="text-red-500 text-xs mt-1">Title must be longer than 10 characters.</p>
                    )}
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={newChallengeDescription}
                    onChange={(e) => setNewChallengeDescription(e.target.value)}
                  />
                  <div>
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
                    {newChallengeOpen && !selectedQuestId && (
                        <p className="text-red-500 text-xs mt-1">Please select a quest.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Target Score: {targetScore}%</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateChallenge} 
                    className="w-full"
                    disabled={!isFormValid || isCreatingChallenge}
                  >
                    {isCreatingChallenge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Challenge
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            )}
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
              {user && (
                <Button onClick={() => setNewChallengeOpen(true)}>Create First Challenge</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => {
              const quest = quests.find(q => q.id === challenge.quest_id);
              const isParticipant = user ? challenge.challenge_participants.some(p => p.user_id === user.id) : false;
              const questProgress = userProgress[challenge.quest_id];
              const hasCompleted = questProgress?.completed;
              const participantEntry = isParticipant 
                ? challenge.challenge_participants.find(p => p.user_id === user.id) 
                : null;

              return (
                <Card key={challenge.id} className="relative overflow-hidden flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-snug">{challenge.title}</CardTitle>
                        <CardDescription className="text-xs">by {challenge.creator_name}</CardDescription>
                      </div>
                      {isParticipant && (
                        <Badge variant="outline">Joined</Badge>
                      )}
                    </div>
                    {challenge.description && <CardDescription>{challenge.description}</CardDescription>}
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    {quest && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="font-semibold text-sm mb-1">Quest: {quest.title}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{quest.difficulty}</Badge>
                          <Badge variant="secondary">{quest.topic}</Badge>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Trophy className="h-3 w-3" />
                          Target Score
                        </p>
                        <p className="font-bold text-base text-primary">{challenge.target_score}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          Participants
                        </p>
                        <p className="font-bold text-base">{challenge.challenge_participants.length}</p>
                      </div>
                    </div>

                    {participantEntry?.score && (
                      <div className="bg-success/10 border border-success/20 p-2 rounded-lg">
                        <p className="text-sm font-medium text-success">Your Score: {participantEntry.score}%</p>
                        {participantEntry.score >= challenge.target_score ? (
                          <p className="text-xs text-muted-foreground">🎉 Target achieved!</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Keep trying!</p>
                        )}
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">PARTICIPANTS</p>
                      <div className="flex flex-wrap gap-2">
                        {challenge.challenge_participants.slice(0, 5).map((participant) => (
                          <div
                            key={participant.user_id}
                            className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-full"
                            title={participant.profiles.username}
                          >
                            <span className="text-sm">{participant.profiles.avatar}</span>
                            <span className="text-xs font-medium">{participant.profiles.username}</span>
                          </div>
                        ))}
                        {challenge.challenge_participants.length > 5 && (
                          <div className="flex items-center px-2 py-1 text-xs text-muted-foreground">
                            +{challenge.challenge_participants.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Clock className="h-4 w-4" />
                         <span>{getTimeRemaining(challenge.expires_at)}</span>
                       </div>
                      <div className="flex gap-2 w-full">
                        {!isParticipant && (
                          <Button
                            variant="outline"
                            onClick={() => handleJoinChallenge(challenge.id)}
                            className="flex-1"
                            disabled={!user}
                          >
                            Join
                          </Button>
                        )}
                        <Button
                          onClick={() => handleStartQuest(challenge.quest_id)}
                          className="flex-1"
                          disabled={!quest}
                        >
                          {hasCompleted ? 'Retry Quest' : 'Start Quest'}
                        </Button>
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
