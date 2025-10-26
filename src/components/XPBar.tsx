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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Level {level}</span>
        <span className="text-sm text-muted-foreground">{currentXP} / {xpForNextLevel} XP</span>
      </div>
      <div className="relative">
        <Progress value={progressPercentage} className="h-3" />
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-xp rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default XPBar;
