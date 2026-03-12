import { motion } from "framer-motion";
import { Lock, CheckCircle2, Play } from "lucide-react";
import { pythonModules, CourseProgress } from "@/lib/pythonCourseData";
import { cn } from "@/lib/utils";

interface LearningPathMapProps {
  progress: CourseProgress;
  onSelectModule: (moduleId: number) => void;
}

export const LearningPathMap = ({ progress, onSelectModule }: LearningPathMapProps) => {
  const isModuleUnlocked = (moduleId: number) => {
    // Module 1 is always unlocked
    if (moduleId === 1) return true;

    // Other modules unlock when the previous module's boss is defeated
    const previousModuleId = moduleId - 1;
    return progress.completedBossFights.includes(previousModuleId);
  };

  const isModuleCompleted = (moduleId: number) => {
    return progress.completedModules.includes(moduleId);
  };

  const getModuleStatus = (moduleId: number) => {
    if (isModuleCompleted(moduleId)) return 'completed';
    if (isModuleUnlocked(moduleId)) return 'unlocked';
    return 'locked';
  };

  return (
    <div className="relative py-8">
      {/* Progress Line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-border rounded-full">
        <motion.div
          className="w-full bg-gradient-to-b from-primary via-accent to-pink-500 rounded-full"
          initial={{ height: 0 }}
          animate={{
            height: `${Math.min(((progress.completedModules.length) / pythonModules.length) * 100, 100)}%`
          }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Module Nodes */}
      <div className="relative space-y-16">
        {pythonModules.map((module, index) => {
          const status = getModuleStatus(module.id);
          const isLeft = index % 2 === 0;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={cn(
                "relative flex items-center gap-6",
                isLeft ? "flex-row" : "flex-row-reverse"
              )}
            >
              {/* Node */}
              <motion.button
                onClick={() => status !== 'locked' && onSelectModule(module.id)}
                disabled={status === 'locked'}
                className={cn(
                  "relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-3xl",
                  "border-4 transition-all duration-300",
                  "left-1/2 transform -translate-x-1/2 absolute",
                  status === 'completed' && "bg-success border-success shadow-[0_0_20px_hsl(var(--success)/0.5)]",
                  status === 'unlocked' && `bg-gradient-to-br ${module.color} border-primary shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-110`,
                  status === 'locked' && "bg-muted border-border grayscale opacity-60 cursor-not-allowed"
                )}
                whileHover={status !== 'locked' ? { scale: 1.1 } : {}}
                whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
              >
                {status === 'locked' ? (
                  <Lock className="w-8 h-8 text-muted-foreground" />
                ) : status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 text-success-foreground" />
                ) : (
                  <span>{module.icon}</span>
                )}

                {/* Glow ring for current level */}
                {status === 'unlocked' && !isModuleCompleted(module.id) && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>

              {/* Info Card */}
              <motion.div
                className={cn(
                  "w-64 p-4 rounded-xl border transition-all duration-300",
                  isLeft ? "ml-auto mr-[calc(50%+60px)]" : "mr-auto ml-[calc(50%+60px)]",
                  status === 'locked'
                    ? "bg-muted/50 border-border opacity-60"
                    : "bg-card border-border hover:border-primary/50 cursor-pointer hover:shadow-lg"
                )}
                onClick={() => status !== 'locked' && onSelectModule(module.id)}
                whileHover={status !== 'locked' ? { y: -4 } : {}}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    status === 'completed' && "bg-success/20 text-success",
                    status === 'unlocked' && "bg-primary/20 text-primary",
                    status === 'locked' && "bg-muted text-muted-foreground"
                  )}>
                    Level {module.id}
                  </span>
                  {status === 'unlocked' && !isModuleCompleted(module.id) && (
                    <span className="text-xs text-primary animate-pulse">Current</span>
                  )}
                </div>

                <h3 className={cn(
                  "font-bold text-lg mb-1",
                  status === 'locked' ? "text-muted-foreground" : "text-foreground"
                )}>
                  {module.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-2">
                  {module.subtitle}
                </p>

                {status !== 'locked' && (
                  <div className={cn(
                    "flex items-center gap-2 text-xs font-medium",
                    status === 'completed' ? "text-success" : "text-primary"
                  )}>
                    {status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {module.questName}
                      </>
                    )}
                  </div>
                )}

                {status === 'locked' && (
                  <p className="text-xs text-muted-foreground">
                    Complete Level {module.id - 1} to unlock
                  </p>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
