import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Star, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type DifficultyBand, type DifficultyVerdict, BAND_LABELS } from "@/lib/difficultyEngine";
import type { ReactNode } from "react";

interface CongratulationsModalProps {
  open: boolean;
  onClose: () => void;
  xpEarned: number;
  isPerfectScore?: boolean;
  questTitle?: string;
  difficultyVerdict?: DifficultyVerdict;
  nextDifficulty?: DifficultyBand;
  interventionSlot?: ReactNode;
}

const motivationalQuotes = [
  "Success is the sum of small efforts repeated day in and day out!",
  "Every expert was once a beginner. You're becoming an expert!",
  "The only way to do great work is to love what you do!",
  "Learning never exhausts the mind. Keep going!",
  "You don't have to be great to start, but you have to start to be great!",
  "The beautiful thing about learning is that no one can take it away from you!",
  "Your potential is limitless. Keep pushing forward!",
  "Excellence is not a skill, it's an attitude!",
  "Progress, not perfection. You're doing amazing!",
  "Knowledge is power, and you're gaining it every day!",
];

/** Pick a random quote — called eagerly so it's ready before first paint */
const randomQuote = () =>
  motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

const VERDICT_CONFIG = {
  promote: {
    icon: TrendingUp,
    label: "Difficulty Promoted!",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
    emoji: "🏆",
  },
  demote: {
    icon: TrendingDown,
    label: "Difficulty Adjusted",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    emoji: "🎯",
  },
  maintain: {
    icon: Minus,
    label: "Difficulty Maintained",
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
    emoji: "⚡",
  },
};

export const CongratulationsModal = ({
  open, onClose, xpEarned, isPerfectScore = false, questTitle,
  difficultyVerdict, nextDifficulty, interventionSlot,
}: CongratulationsModalProps) => {
  // ── FIX: lazy initializer so quote is ready on first render (no blink) ──
  const [quote, setQuote] = useState<string>(randomQuote);

  // Refresh quote each time the modal re-opens, but only when open=true
  useEffect(() => {
    if (open) setQuote(randomQuote());
  }, [open]);

  const verdictCfg = difficultyVerdict ? VERDICT_CONFIG[difficultyVerdict] : null;
  const VerdictIcon = verdictCfg?.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* ── SIZE: was sm:max-w-md (448px) → sm:max-w-sm (384px) ≈ 14% narrower
              Combined with reduced padding/spacing = ~20% smaller overall footprint */}
      <DialogContent className="sm:max-w-sm bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/30 shadow-lg overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-hero opacity-5 pointer-events-none" />

          {/* Floating sparkles — smaller */}
          <div className="absolute top-3 right-3">
            <Sparkles className="h-6 w-6 text-accent animate-bounce-subtle" style={{ animationDelay: '0s' }} />
          </div>
          <div className="absolute top-6 left-3">
            <Star className="h-5 w-5 text-primary animate-bounce-subtle" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="absolute bottom-6 right-6">
            <Zap className="h-4 w-4 text-success animate-bounce-subtle" style={{ animationDelay: '0.6s' }} />
          </div>

          {/* ── Trophy — was w-32 h-32 / p-6, reduced to w-20 h-20 / p-4 ── */}
          <DialogHeader className="text-center space-y-2 pb-2">
            <div className="relative mx-auto">
              <div className="relative bg-gradient-hero p-4 rounded-full w-20 h-20 flex items-center justify-center animate-scale-in shadow-md">
                {isPerfectScore
                  ? <Trophy className="h-10 w-10 text-white animate-bounce-subtle" />
                  : <Star className="h-10 w-10 text-white fill-white animate-spin-slow" />}
              </div>
              <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-accent rounded-full animate-bounce-subtle" style={{ animationDelay: '0s' }} />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-success rounded-full animate-bounce-subtle" style={{ animationDelay: '0.4s' }} />
              <div className="absolute -bottom-1 -right-0 w-2 h-2 bg-accent rounded-full animate-bounce-subtle" style={{ animationDelay: '0.6s' }} />
            </div>

            {/* ── Title: was text-2xl sm:text-3xl → text-xl sm:text-2xl ── */}
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-fade-in-up">
              🎉 Congratulations! 🎉
            </DialogTitle>

            {isPerfectScore && (
              <div className="inline-flex items-center gap-1.5 bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-semibold animate-fade-in-up">
                <Trophy className="h-3.5 w-3.5" /> Perfect Score!
              </div>
            )}
            {questTitle && (
              <DialogDescription className="text-sm text-foreground font-medium animate-fade-in-up">
                You completed: <span className="text-primary font-semibold">{questTitle}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {/* ── XP Earned: was py-4 / text-3xl sm:text-4xl → py-2 / text-2xl sm:text-3xl ── */}
          <div className="text-center py-2 animate-fade-in-up">
            <div className="bg-gradient-xp text-white px-4 py-2 rounded-lg shadow-md">
              <p className="text-xs opacity-90 mb-0.5">XP Earned</p>
              <p className="text-2xl sm:text-3xl font-bold">+{xpEarned}</p>
            </div>
          </div>

          {/* Difficulty change badge */}
          {verdictCfg && nextDifficulty && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${verdictCfg.bg} animate-fade-in-up mt-2`}>
              {VerdictIcon && <VerdictIcon className={`h-3.5 w-3.5 ${verdictCfg.color}`} />}
              <span className={verdictCfg.color}>{verdictCfg.emoji} {verdictCfg.label}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Next: {BAND_LABELS[nextDifficulty]}
              </Badge>
            </div>
          )}

          {/* Intervention Banner slot */}
          {interventionSlot}

          {/* ── Quote: was py-4 / p-4 → py-2 / p-3, smaller sparkle ── */}
          <div className="text-center py-2 animate-fade-in-up">
            <div className="relative bg-card/60 backdrop-blur-sm border border-primary/30 rounded-lg p-3">
              <Sparkles className="h-4 w-4 text-primary absolute top-2 left-2 opacity-30" />
              <p className="text-xs italic text-muted-foreground px-3 py-1 font-medium">"{quote}"</p>
            </div>
          </div>

          {/* ── Close: was pt-4 → pt-2, size lg → default ── */}
          <div className="flex justify-center pt-2 animate-fade-in-up">
            <Button
              onClick={onClose}
              className="bg-gradient-hero text-white hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg"
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
