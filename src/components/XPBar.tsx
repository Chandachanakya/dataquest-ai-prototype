import { Progress } from "@/components/ui/progress";

interface XPBarProps {
  currentXP: number;
  level: number;
}

const XPBar = ({ currentXP, level }: XPBarProps) => {
  // XP required for next level (exponential growth)
  const xpForNextLevel = level * 200;
  const progressPercentage = (currentXP / xpForNextLevel) * 100;

  return (
    <div className="w-full" role="progressbar" aria-label={`XP Progress: ${currentXP} of ${xpForNextLevel}`} aria-valuenow={currentXP} aria-valuemin={0} aria-valuemax={xpForNextLevel}>
      <div className="flex items-center justify-between mb-2 animate-fade-in">
        <span className="text-sm font-medium text-foreground">Level {level}</span>
        <span className="text-sm text-muted-foreground">{currentXP} / {xpForNextLevel} XP</span>
      </div>
      <div className="relative">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className="h-full bg-gradient-xp transition-all duration-700 ease-out rounded-full"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          {/* Animated shimmer effect overlay */}
          <div 
            className="absolute top-0 left-0 h-3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer pointer-events-none rounded-full"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default XPBar;
