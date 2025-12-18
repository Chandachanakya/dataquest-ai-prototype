import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AVATARS = ["🎓", "🧙‍♂️", "🥷", "🧠", "💻", "🐍", "🚀", "⚡", "🎯", "🏆"];
const LEARNING_STYLES = [
  { value: "visual", label: "Visual", description: "I learn best with diagrams and videos" },
  { value: "hands-on", label: "Hands-on", description: "I learn by doing and practicing" },
  { value: "reading", label: "Reading", description: "I prefer detailed explanations" },
];
const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Just starting out" },
  { value: "intermediate", label: "Intermediate", description: "Some experience" },
  { value: "advanced", label: "Advanced", description: "Expert level" },
];
const TOPICS = [
  "javascript", "python", "react", "algorithms", "data-structures", 
  "css", "html", "databases", "backend", "ml"
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [learningStyle, setLearningStyle] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
    }
  }, [user, authLoading, navigate]);

  // Pre-populate with existing profile data if available
  useEffect(() => {
    if (profile) {
      if (profile.avatar) setSelectedAvatar(profile.avatar);
      if (profile.learning_style) setLearningStyle(profile.learning_style);
      if (profile.difficulty) setDifficulty(profile.difficulty);
      if (profile.topics?.length) setSelectedTopics(profile.topics);
    }
  }, [profile]);

  const handleComplete = async () => {
    if (!learningStyle || !difficulty || selectedTopics.length === 0) {
      toast.error("Please complete all fields");
      return;
    }

    setIsSubmitting(true);

    const { error } = await updateProfile({
      avatar: selectedAvatar,
      learning_style: learningStyle as 'visual' | 'hands-on' | 'reading',
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      topics: selectedTopics,
    });

    if (error) {
      toast.error("Failed to save preferences. Please try again.");
      setIsSubmitting(false);
      return;
    }

    toast.success("Profile created! Let's start learning!");
    navigate('/dashboard');
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            <span className="text-sm font-medium text-primary">{Math.round((step / 3) * 100)}%</span>
          </div>
          <CardTitle className="text-2xl">
            {step === 1 && "Choose Your Avatar"}
            {step === 2 && "How Do You Learn Best?"}
            {step === 3 && "What Interests You?"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Pick an avatar that represents you"}
            {step === 2 && "Tell us about your learning preferences"}
            {step === 3 && "Select topics you want to master"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="grid grid-cols-5 gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-5xl p-4 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedAvatar === avatar
                      ? "border-primary bg-primary/10 scale-110"
                      : "border-border hover:border-primary/50"
                  }`}
                  aria-label={`Select avatar ${avatar}`}
                  aria-pressed={selectedAvatar === avatar}
                >
                  {avatar}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <RadioGroup value={learningStyle} onValueChange={setLearningStyle}>
                {LEARNING_STYLES.map((style) => (
                  <div
                    key={style.value}
                    className={`flex items-start space-x-3 border-2 rounded-lg p-4 transition-all ${
                      learningStyle === style.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={style.value} id={style.value} className="mt-1" />
                    <Label htmlFor={style.value} className="flex-1 cursor-pointer">
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-sm text-muted-foreground">{style.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Difficulty Level</Label>
                <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <div
                      key={level.value}
                      className={`flex items-start space-x-3 border-2 rounded-lg p-4 transition-all ${
                        difficulty === level.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={level.value} id={level.value} className="mt-1" />
                      <Label htmlFor={level.value} className="flex-1 cursor-pointer">
                        <div className="font-semibold">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">Select at least one topic (you can choose multiple)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`p-3 rounded-lg border-2 transition-all font-medium ${
                      selectedTopics.includes(topic)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                    aria-label={`Toggle ${topic}`}
                    aria-pressed={selectedTopics.includes(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                Back
              </Button>
            )}
            <Button
              variant="hero"
              onClick={() => step === 3 ? handleComplete() : setStep(step + 1)}
              disabled={(step === 3 && selectedTopics.length === 0) || isSubmitting}
              className="ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                step === 3 ? "Complete Setup" : "Continue"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
