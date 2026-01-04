import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Zap, ArrowRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Module, Challenge } from "@/lib/mlCourseData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MLKnowledgeCheckProps {
  module: Module;
  completedChallenges: string[];
  onChallengeComplete: (challengeId: string, xp: number) => void;
  onAllComplete: () => void;
}

export const MLKnowledgeCheck = ({
  module,
  completedChallenges,
  onChallengeComplete,
  onAllComplete
}: MLKnowledgeCheckProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const challenges = module.challenges;
  const currentChallenge = challenges[currentIndex];
  const isAlreadyCompleted = completedChallenges.includes(currentChallenge?.id || "");
  const allCompleted = challenges.every(c => completedChallenges.includes(c.id));

  useEffect(() => {
    // Find first uncompleted challenge
    const firstUncompleted = challenges.findIndex(c => !completedChallenges.includes(c.id));
    if (firstUncompleted !== -1) {
      setCurrentIndex(firstUncompleted);
    }
  }, [challenges, completedChallenges]);

  const handleAnswer = (index: number) => {
    if (showResult || isAlreadyCompleted) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === currentChallenge.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct && !isAlreadyCompleted) {
      onChallengeComplete(currentChallenge.id, currentChallenge.xpReward);
      toast.success(`+${currentChallenge.xpReward} XP earned!`);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (allCompleted || (showResult && isCorrect)) {
      onAllComplete();
    }
  };

  if (allCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/20 mb-6">
          <Trophy className="w-10 h-10 text-success" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">All Challenges Complete!</h3>
        <p className="text-muted-foreground mb-6">You've mastered this level's challenges.</p>
        <Button onClick={onAllComplete} className="gap-2">
          Continue to Boss Fight
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Challenge {currentIndex + 1} of {challenges.length}</span>
        <span className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-500" />
          +{currentChallenge.xpReward} XP
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${((completedChallenges.filter(id => challenges.some(c => c.id === id)).length) / challenges.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <Card className="border-2 border-violet-500/20">
        <CardHeader>
          <CardTitle className="text-xl">{currentChallenge.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentChallenge.options.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult || isAlreadyCompleted}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all",
                "hover:border-violet-500/50",
                selectedAnswer === index && !showResult && "border-violet-500 bg-violet-500/10",
                showResult && index === currentChallenge.correctAnswer && "border-success bg-success/10",
                showResult && selectedAnswer === index && index !== currentChallenge.correctAnswer && "border-destructive bg-destructive/10",
                isAlreadyCompleted && "opacity-60 cursor-not-allowed"
              )}
              whileHover={!showResult && !isAlreadyCompleted ? { scale: 1.01 } : {}}
              whileTap={!showResult && !isAlreadyCompleted ? { scale: 0.99 } : {}}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {showResult && index === currentChallenge.correctAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                )}
                {showResult && selectedAnswer === index && index !== currentChallenge.correctAnswer && (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            </motion.button>
          ))}
        </CardContent>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-lg border-2",
              isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
            )}
          >
            <p className={cn(
              "font-semibold mb-1",
              isCorrect ? "text-success" : "text-destructive"
            )}>
              {isCorrect ? "Correct! 🎉" : "Not quite right"}
            </p>
            <p className="text-sm text-muted-foreground">{currentChallenge.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!showResult ? (
          <Button 
            onClick={handleSubmit} 
            disabled={selectedAnswer === null || isAlreadyCompleted}
            className="bg-violet-600 hover:bg-violet-700"
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={handleNext} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {currentIndex < challenges.length - 1 ? "Next Challenge" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
