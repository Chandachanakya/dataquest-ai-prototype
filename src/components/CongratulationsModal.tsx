import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Star, Zap } from "lucide-react";

interface CongratulationsModalProps {
  open: boolean;
  onClose: () => void;
  xpEarned: number;
  isPerfectScore?: boolean;
  questTitle?: string;
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

export const CongratulationsModal = ({
  open,
  onClose,
  xpEarned,
  isPerfectScore = false,
  questTitle,
}: CongratulationsModalProps) => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Select a random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/30 shadow-lg overflow-hidden">
        <div className="relative">
          {/* Subtle background */}
          <div className="absolute inset-0 bg-gradient-hero opacity-5 pointer-events-none" />

          {/* Sparkles animation */}
          <div className="absolute top-4 right-4">
            <Sparkles className="h-8 w-8 text-accent animate-bounce-subtle" style={{ animationDelay: '0s' }} />
          </div>
          <div className="absolute top-8 left-4">
            <Star className="h-6 w-6 text-primary animate-bounce-subtle" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="absolute bottom-8 right-8">
            <Zap className="h-5 w-5 text-success animate-bounce-subtle" style={{ animationDelay: '0.6s' }} />
          </div>

          <DialogHeader className="text-center space-y-4 pb-4">
            {/* Trophy/Avatar */}
            <div className="relative mx-auto">
              <div className="relative bg-gradient-hero p-6 rounded-full w-32 h-32 flex items-center justify-center animate-scale-in shadow-md">
                {isPerfectScore ? (
                  <Trophy className="h-16 w-16 text-white animate-bounce-subtle" />
                ) : (
                  <Star className="h-16 w-16 text-white fill-white animate-spin-slow" />
                )}
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -left-2 w-3 h-3 bg-accent rounded-full animate-bounce-subtle" style={{ animationDelay: '0s' }} />
              <div className="absolute -top-1 -right-2 w-2 h-2 bg-primary rounded-full animate-bounce-subtle" style={{ animationDelay: '0.2s' }} />
              <div className="absolute -bottom-2 -left-1 w-2.5 h-2.5 bg-success rounded-full animate-bounce-subtle" style={{ animationDelay: '0.4s' }} />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-accent rounded-full animate-bounce-subtle" style={{ animationDelay: '0.6s' }} />
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-fade-in-up">
              🎉 Congratulations! 🎉
            </DialogTitle>
            {isPerfectScore && (
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-semibold animate-fade-in-up delay-100">
                <Trophy className="h-4 w-4" />
                Perfect Score!
              </div>
            )}
            {questTitle && (
              <DialogDescription className="text-base text-foreground font-medium animate-fade-in-up delay-150">
                You completed: <span className="text-primary font-semibold">{questTitle}</span>
              </DialogDescription>
            )}
          </DialogHeader>

          {/* XP Earned Section */}
          <div className="text-center space-y-4 py-4 animate-fade-in-up delay-200">
            <div className="bg-gradient-xp text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-md relative overflow-hidden">
              <div className="relative">
                <p className="text-xs sm:text-sm opacity-90 mb-1">XP Earned</p>
                <p className="text-3xl sm:text-4xl font-bold">+{xpEarned}</p>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="text-center space-y-4 py-4 animate-fade-in-up delay-300">
            <div className="relative bg-card/60 backdrop-blur-sm border border-primary/30 rounded-xl p-4">
              <Sparkles className="h-5 w-5 text-primary absolute top-2 left-2 opacity-40" />
              <p className="text-sm italic text-foreground px-4 py-2 font-medium">
                "{quote}"
              </p>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-4 animate-fade-in-up delay-400">
            <Button
              onClick={onClose}
              size="lg"
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

