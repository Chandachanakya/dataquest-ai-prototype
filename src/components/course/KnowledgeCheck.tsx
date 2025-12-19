import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, X, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Module, Challenge } from "@/lib/pythonCourseData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KnowledgeCheckProps {
  module: Module;
  completedChallenges: string[];
  onChallengeComplete: (challengeId: string, xp: number) => void;
  onAllComplete: () => void;
}

export const KnowledgeCheck = ({ 
  module, 
  completedChallenges, 
  onChallengeComplete,
  onAllComplete 
}: KnowledgeCheckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const challenge = module.challenges[currentIndex];
  const isAlreadyCompleted = completedChallenges.includes(challenge.id);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00d4ff', '#a855f7', '#22c55e']
    });
  }, []);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === challenge.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct && !isAlreadyCompleted) {
      triggerConfetti();
      onChallengeComplete(challenge.id, challenge.xpReward);
      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-bold">+{challenge.xpReward} XP!</span>
        </div>,
        { duration: 3000 }
      );
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    
    if (currentIndex < module.challenges.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onAllComplete();
    }
  };

  const completedCount = module.challenges.filter(c => completedChallenges.includes(c.id)).length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
          <Zap className="w-3 h-3 mr-1" />
          Challenge {currentIndex + 1} of {module.challenges.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {completedCount}/{module.challenges.length} Completed
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="text-2xl">{module.icon}</span>
                {challenge.question}
              </CardTitle>
              {isAlreadyCompleted && (
                <Badge className="w-fit bg-success/20 text-success border-success/30">
                  <Check className="w-3 h-3 mr-1" />
                  Already Completed
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Options */}
              <div className="space-y-3">
                {challenge.options.map((option, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => !showResult && setSelectedAnswer(idx)}
                    disabled={showResult}
                    className={cn(
                      "w-full p-4 rounded-lg border text-left transition-all",
                      "flex items-center gap-3",
                      !showResult && selectedAnswer === idx && "border-primary bg-primary/10",
                      !showResult && selectedAnswer !== idx && "border-border bg-background hover:border-primary/50",
                      showResult && idx === challenge.correctAnswer && "border-success bg-success/10",
                      showResult && selectedAnswer === idx && idx !== challenge.correctAnswer && "border-destructive bg-destructive/10"
                    )}
                    whileHover={!showResult ? { scale: 1.02 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                  >
                    <span className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      "border-2 transition-colors",
                      !showResult && selectedAnswer === idx && "border-primary bg-primary text-primary-foreground",
                      !showResult && selectedAnswer !== idx && "border-muted-foreground text-muted-foreground",
                      showResult && idx === challenge.correctAnswer && "border-success bg-success text-success-foreground",
                      showResult && selectedAnswer === idx && idx !== challenge.correctAnswer && "border-destructive bg-destructive text-destructive-foreground"
                    )}>
                      {showResult && idx === challenge.correctAnswer ? (
                        <Check className="w-4 h-4" />
                      ) : showResult && selectedAnswer === idx ? (
                        <X className="w-4 h-4" />
                      ) : (
                        String.fromCharCode(65 + idx)
                      )}
                    </span>
                    <span className="flex-1">{option}</span>
                  </motion.button>
                ))}
              </div>

              {/* Result */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "p-4 rounded-lg border",
                      isCorrect 
                        ? "bg-success/10 border-success/30" 
                        : "bg-destructive/10 border-destructive/30"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isCorrect ? (
                        <>
                          <Trophy className="w-5 h-5 text-success" />
                          <span className="font-bold text-success">Correct!</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-destructive" />
                          <span className="font-bold text-destructive">Not quite!</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {challenge.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                {!showResult ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNext} className="gap-2">
                    {currentIndex < module.challenges.length - 1 ? "Next Challenge" : "Boss Fight!"}
                    <Trophy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
