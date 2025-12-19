import { useState, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import confetti from "canvas-confetti";
import { Sword, Trophy, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Module } from "@/lib/pythonCourseData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BossFightProps {
  module: Module;
  isCompleted: boolean;
  onComplete: (xp: number) => void;
}

export const BossFight = ({ module, isCompleted, onComplete }: BossFightProps) => {
  const [codeBlocks, setCodeBlocks] = useState(
    module.bossFight.codeBlocks.map((code, idx) => ({
      id: idx,
      code,
      originalIndex: idx
    })).sort(() => Math.random() - 0.5)
  );
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const triggerEpicConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#00d4ff', '#a855f7', '#22c55e', '#f59e0b']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#00d4ff', '#a855f7', '#22c55e', '#f59e0b']
      });
    }, 250);
  }, []);

  const handleSubmit = () => {
    const currentOrder = codeBlocks.map(b => b.originalIndex);
    const correct = JSON.stringify(currentOrder) === JSON.stringify(module.bossFight.correctOrder);
    
    setIsCorrect(correct);
    setShowResult(true);

    if (correct && !isCompleted) {
      triggerEpicConfetti();
      onComplete(module.bossFight.xpReward);
      toast.success(
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="font-bold">BOSS DEFEATED! +{module.bossFight.xpReward} XP!</span>
        </div>,
        { duration: 5000 }
      );
    }
  };

  const handleReset = () => {
    setCodeBlocks(
      module.bossFight.codeBlocks.map((code, idx) => ({
        id: idx,
        code,
        originalIndex: idx
      })).sort(() => Math.random() - 0.5)
    );
    setShowResult(false);
  };

  return (
    <div className="space-y-4">
      <Card className={cn(
        "border-2 bg-gradient-to-br from-card to-background overflow-hidden",
        "border-destructive/50 shadow-[0_0_30px_hsl(var(--destructive)/0.3)]"
      )}>
        <CardHeader className="bg-destructive/10 border-b border-destructive/30">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Sword className="w-6 h-6 text-destructive" />
            </motion.div>
            <span>BOSS FIGHT: Terminal Challenge</span>
            <Badge className="ml-auto bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              +{module.bossFight.xpReward} XP
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isCompleted && (
            <div className="flex items-center gap-2 text-success bg-success/10 p-3 rounded-lg">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Boss Defeated! Level Complete!</span>
              <Sparkles className="w-5 h-5 ml-auto animate-pulse" />
            </div>
          )}

          <p className="text-foreground font-medium">
            {module.bossFight.question}
          </p>

          {/* Draggable Code Blocks */}
          <Reorder.Group 
            axis="y" 
            values={codeBlocks} 
            onReorder={setCodeBlocks}
            className="space-y-2"
          >
            {codeBlocks.map((block, idx) => (
              <Reorder.Item
                key={block.id}
                value={block}
                className={cn(
                  "p-4 rounded-lg border cursor-grab active:cursor-grabbing",
                  "bg-background/80 border-border",
                  "hover:border-primary/50 hover:bg-background transition-colors",
                  showResult && isCorrect && "border-success bg-success/10",
                  showResult && !isCorrect && "border-destructive/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                    {idx + 1}
                  </span>
                  <code className="text-sm font-mono text-foreground flex-1">
                    {block.code}
                  </code>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Result */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-lg border",
                isCorrect 
                  ? "bg-success/10 border-success/30" 
                  : "bg-destructive/10 border-destructive/30"
              )}
            >
              <p className={cn(
                "font-bold mb-2",
                isCorrect ? "text-success" : "text-destructive"
              )}>
                {isCorrect ? "🎉 VICTORY! Boss Defeated!" : "💀 Not quite right..."}
              </p>
              <p className="text-sm text-muted-foreground">
                {module.bossFight.explanation}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            {!showResult && (
              <Button 
                onClick={handleSubmit}
                className="gap-2 bg-gradient-to-r from-destructive to-orange-500 hover:opacity-90"
              >
                <Sword className="w-4 h-4" />
                Fight!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
