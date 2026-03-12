import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface XPBarProps {
  currentXP: number;
  level: number;
}

/** XP required to complete level N = N × 200 (progressive scaling) */
export function xpForLevel(level: number): number {
  return level * 200;
}

const XPBar = ({ currentXP, level }: XPBarProps) => {
  const threshold = xpForLevel(level);
  const xpIntoLevel = currentXP % threshold;     // XP progress within current level
  const progressPct = Math.min((xpIntoLevel / threshold) * 100, 100);
  const xpToGo = threshold - xpIntoLevel;
  const isCloseToLevelUp = progressPct >= 80;
  const progressLabel = `${Math.round(progressPct)}%`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="w-full cursor-help"
            role="progressbar"
            aria-label={`XP Progress: ${xpIntoLevel} of ${threshold} XP — Level ${level}`}
            aria-valuenow={xpIntoLevel}
            aria-valuemin={0}
            aria-valuemax={threshold}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-1.5 animate-fade-in">
              <span className="text-sm font-semibold text-foreground">Level {level}</span>
              <span className="text-xs text-muted-foreground">
                {xpIntoLevel.toLocaleString()} / {threshold.toLocaleString()} XP
              </span>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <div
                className={`relative h-3 w-full overflow-hidden rounded-full bg-secondary transition-all duration-300
                  ${isCloseToLevelUp ? 'ring-1 ring-amber-400/60 ring-offset-0' : ''}`}
              >
                {/* Fill */}
                <div
                  className="h-full bg-gradient-xp transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
                {/* Shimmer */}
                <div
                  className="absolute top-0 left-0 h-3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
                {/* Milestone ticks */}
                {[25, 50, 75].map(tick => (
                  <div
                    key={tick}
                    className="absolute top-0 h-3 w-0.5 bg-background/30"
                    style={{ left: `${tick}%` }}
                  />
                ))}
                {/* % label inside bar */}
                {progressPct > 15 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/80 pointer-events-none">
                    {progressLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {xpToGo.toLocaleString()} XP to Level {level + 1}
            </p>
          </div>
        </TooltipTrigger>

        <TooltipContent>
          <p className="font-semibold">Level {level} · {progressLabel} complete</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {xpToGo.toLocaleString()} XP to Level {level + 1} (requires {xpForLevel(level + 1).toLocaleString()} XP total)
          </p>
          {isCloseToLevelUp && (
            <p className="text-xs text-amber-400 mt-1">Almost there! 🎉</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XPBar;
