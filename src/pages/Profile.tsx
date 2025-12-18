import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";

const AVATAR_OPTIONS = ["🧙‍♂️", "🥷", "🧠", "💻", "🐍", "🚀", "🎯", "⚡", "🔥", "🌟", "🎮", "🤖"];

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [learningStyle, setLearningStyle] = useState<"visual" | "hands-on" | "reading">("visual");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [topics, setTopics] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const availableTopics = [
    "python", "javascript", "react", "sql", "machine-learning", 
    "data-science", "algorithms", "backend", "frontend", "databases"
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAvatar(profile.avatar);
      setLearningStyle(profile.learning_style);
      setDifficulty(profile.difficulty);
      setTopics(profile.topics || []);
    }
  }, [profile]);

  const handleTopicToggle = (topic: string) => {
    setTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSave = async () => {
    if (!profile) return;
    
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setIsSaving(true);

    const { error } = await updateProfile({
      username: username.trim(),
      avatar,
      learning_style: learningStyle,
      difficulty,
      topics
    });

    setIsSaving(false);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully!");
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
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <UserAvatar avatar={avatar} username={username} size="xl" showGlow />
            </div>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>Customize your learning experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={20}
              />
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <Label>Choose Avatar</Label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((avatarOption) => (
                  <button
                    key={avatarOption}
                    type="button"
                    onClick={() => setAvatar(avatarOption)}
                    className={`text-3xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                      avatar === avatarOption
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border hover:border-primary/50"
                    }`}
                    aria-label={`Select avatar ${avatarOption}`}
                  >
                    {avatarOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Learning Style */}
            <div className="space-y-2">
              <Label htmlFor="learningStyle">Learning Style</Label>
              <Select value={learningStyle} onValueChange={(v) => setLearningStyle(v as typeof learningStyle)}>
                <SelectTrigger id="learningStyle">
                  <SelectValue placeholder="Select learning style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual - Learn through diagrams and videos</SelectItem>
                  <SelectItem value="hands-on">Hands-on - Learn by doing</SelectItem>
                  <SelectItem value="reading">Reading - Learn through documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Level */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Preferred Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Just getting started</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Know the basics</SelectItem>
                  <SelectItem value="advanced">Advanced - Ready for challenges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Topics of Interest */}
            <div className="space-y-2">
              <Label>Topics of Interest</Label>
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicToggle(topic)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      topics.includes(topic)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats (Read-only) */}
            <div className="pt-4 border-t border-border">
              <Label className="text-muted-foreground">Your Stats</Label>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{profile.level}</div>
                  <div className="text-xs text-muted-foreground">Level</div>
                </div>
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-accent">{profile.total_xp.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total XP</div>
                </div>
                <div className="text-center p-3 bg-secondary/30 rounded-lg">
                  <div className="text-2xl font-bold text-success">{(profile.badges || []).length}</div>
                  <div className="text-xs text-muted-foreground">Badges</div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} className="w-full" size="lg" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
