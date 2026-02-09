import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface XPBarProps {
  currentXP: number;
  level: number;
}

const XPBar = ({ currentXP, level }: XPBarProps) => {
  const xpForNextLevel = 200;
  const progressPercentage = (currentXP / xpForNextLevel) * 100;
  const isCloseToLevelUp = progressPercentage >= 80;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="w-full cursor-help"
            role="progressbar"
            aria-label={`XP Progress: ${currentXP} of ${xpForNextLevel}`}
            aria-valuenow={currentXP}
            aria-valuemin={0}
            aria-valuemax={xpForNextLevel}
          >
            <div className="flex items-center justify-between mb-2 animate-fade-in">
              <span className="text-sm font-medium text-foreground">Level {level}</span>
              <span className="text-sm text-muted-foreground">{currentXP} / {xpForNextLevel} XP</span>
            </div>
            <div className="relative">
              <div className={`relative h-3 w-full overflow-hidden rounded-full bg-secondary transition-all duration-300 ${isCloseToLevelUp ? 'glow' : ''}`}>
                <div
                  className="h-full bg-gradient-xp transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
                {/* Animated shimmer effect overlay */}
                <div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none rounded-full"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
                {/* Milestone markers */}
                {[25, 50, 75].map((milestone) => (
                  <div
                    key={milestone}
                    className="absolute top-0 h-3 w-0.5 bg-background/30"
                    style={{ left: `${milestone}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">
            {xpForNextLevel - currentXP} XP to Level {level + 1}
          </p>
          {isCloseToLevelUp && (
            <p className="text-xs text-muted-foreground mt-1">
              Almost there! 🎉
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPBar;
