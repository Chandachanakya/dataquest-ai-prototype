import { motion } from "framer-motion";
import { Zap, Star, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Module } from "@/lib/pythonCourseData";

// Generic CourseProgress interface that works with all courses
interface CourseProgress {
  currentLevel: number;
  totalXP: number;
  completedModules: number[];
  completedChallenges: string[];
  completedBossFights: number[];
  completedVideos?: number[]; // Optional for courses that don't track videos
}

interface XPDisplayProps {
  progress: CourseProgress;
  modules: Module[]; // Accept modules array as prop
}

export const XPDisplay = ({ progress, modules }: XPDisplayProps) => {
  const currentModuleIndex = Math.min(progress.currentLevel - 1, modules.length - 1);
  const currentModule = modules[currentModuleIndex];
  const nextModule = modules[currentModuleIndex + 1];

  const xpForCurrentLevel = currentModule?.xpRequired || 0;
  const xpForNextLevel = nextModule?.xpRequired || progress.totalXP;
  const xpInLevel = progress.totalXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min((xpInLevel / xpNeeded) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-card via-card to-background border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Level Badge */}
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br from-primary to-accent",
              "shadow-[0_0_20px_hsl(var(--primary)/0.5)]"
            )}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl">{currentModule?.icon || "🏆"}</span>
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Level</p>
            <p className="font-bold text-foreground">
              {currentModule?.title || "Champion"}
            </p>
          </div>
        </div>

        {/* XP Stats */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-foreground">{progress.totalXP} XP</span>
            </div>
            {nextModule && (
              <span className="text-xs text-muted-foreground">
                {xpForNextLevel - progress.totalXP} XP to unlock Level {nextModule.id}
              </span>
            )}
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-3" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ width: "50%" }}
            />
          </div>
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-success">
              <Trophy className="w-4 h-4" />
              <span className="font-bold">{progress.completedModules.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Modules</p>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-accent">
              <Star className="w-4 h-4" />
              <span className="font-bold">{progress.completedChallenges.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Challenges</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
