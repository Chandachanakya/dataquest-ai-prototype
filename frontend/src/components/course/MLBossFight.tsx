import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Sword, CheckCircle2, Trophy, Zap, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Module } from "@/lib/mlCourseData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MLBossFightProps {
  module: Module;
  isCompleted: boolean;
  onComplete: (xp: number) => void;
}

export const MLBossFight = ({ module, isCompleted, onComplete }: MLBossFightProps) => {
  const [codeOrder, setCodeOrder] = useState<number[]>(
    [...Array(module.bossFight.codeBlocks.length).keys()].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    const correct = JSON.stringify(codeOrder) === JSON.stringify(module.bossFight.correctOrder);
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct && !isCompleted) {
      onComplete(module.bossFight.xpReward);
      toast.success(`Boss Defeated! +${module.bossFight.xpReward} XP earned!`);
    }
  };

  const handleReset = () => {
    setCodeOrder([...Array(module.bossFight.codeBlocks.length).keys()].sort(() => Math.random() - 0.5));
    setSubmitted(false);
    setIsCorrect(false);
  };

  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/20 mb-6">
          <Trophy className="w-12 h-12 text-success" />
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-2">Boss Defeated! 🏆</h3>
        <p className="text-muted-foreground mb-4">
          You've conquered {module.title}!
        </p>
        <div className="flex items-center justify-center gap-2 text-success">
          <Zap className="w-5 h-5" />
          <span className="font-bold">+{module.bossFight.xpReward} XP Earned</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Boss Introduction */}
      <Card className="border-2 border-rose-500/30 bg-gradient-to-br from-card via-card to-rose-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/20">
              <Sword className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-rose-500">Boss Fight</CardTitle>
              <CardDescription>Arrange the code in the correct order</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground font-medium">{module.bossFight.question}</p>
        </CardContent>
      </Card>

      {/* Code Blocks */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Drag to reorder:</p>
        <Reorder.Group
          axis="y"
          values={codeOrder}
          onReorder={setCodeOrder}
          className="space-y-2"
        >
          {codeOrder.map((index) => (
            <Reorder.Item
              key={index}
              value={index}
              className={cn(
                "p-4 rounded-lg border-2 bg-card cursor-grab active:cursor-grabbing",
                "border-border hover:border-rose-500/50 transition-colors",
                submitted && isCorrect && "border-success",
                submitted && !isCorrect && "border-destructive"
              )}
            >
              <code className="text-sm font-mono text-foreground">
                {module.bossFight.codeBlocks[index]}
              </code>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Result */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "p-4 rounded-lg border-2",
              isCorrect ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
            )}
          >
            {isCorrect ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-success" />
                <div>
                  <p className="font-bold text-success">Victory! 🎉</p>
                  <p className="text-sm text-muted-foreground">{module.bossFight.explanation}</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-bold text-destructive mb-1">Not quite right...</p>
                <p className="text-sm text-muted-foreground">Try rearranging the code blocks and submit again.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {submitted && !isCorrect && (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        {!submitted && (
          <Button 
            onClick={handleSubmit}
            className="gap-2 bg-rose-600 hover:bg-rose-700"
          >
            <Sword className="w-4 h-4" />
            Submit Answer
          </Button>
        )}
      </div>
    </div>
  );
};
