import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Trophy, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LearningPathMap } from "@/components/course/LearningPathMap";
import { ModulePage } from "@/components/course/ModulePage";
import { XPDisplay } from "@/components/course/XPDisplay";
import { 
  pythonModules, 
  CourseProgress, 
  getInitialProgress, 
  STORAGE_KEY 
} from "@/lib/pythonCourseData";
import { cn } from "@/lib/utils";

const PythonCourse = () => {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [progress, setProgress] = useState<CourseProgress>(getInitialProgress);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved progress");
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const handleChallengeComplete = useCallback((challengeId: string, xp: number) => {
    setProgress(prev => {
      if (prev.completedChallenges.includes(challengeId)) {
        return prev;
      }
      return {
        ...prev,
        totalXP: prev.totalXP + xp,
        completedChallenges: [...prev.completedChallenges, challengeId]
      };
    });
  }, []);

  const handleBossComplete = useCallback((moduleId: number, xp: number) => {
    setProgress(prev => {
      if (prev.completedBossFights.includes(moduleId)) {
        return prev;
      }
      
      const newCompletedModules = prev.completedModules.includes(moduleId)
        ? prev.completedModules
        : [...prev.completedModules, moduleId];
      
      const nextLevel = Math.min(moduleId + 1, pythonModules.length);
      
      return {
        ...prev,
        totalXP: prev.totalXP + xp,
        completedBossFights: [...prev.completedBossFights, moduleId],
        completedModules: newCompletedModules,
        currentLevel: Math.max(prev.currentLevel, nextLevel)
      };
    });
  }, []);

  const currentModule = selectedModule 
    ? pythonModules.find(m => m.id === selectedModule) 
    : null;

  if (currentModule) {
    return (
      <ModulePage
        module={currentModule}
        progress={progress}
        onBack={() => setSelectedModule(null)}
        onChallengeComplete={handleChallengeComplete}
        onBossComplete={handleBossComplete}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/courses')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Courses
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐍</span>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Python for Data Science
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Your Quest Awaits, Data Warrior
          </h2>
          <p className="text-muted-foreground text-lg">
            Master Python through 5 epic levels. Complete challenges, defeat bosses, 
            and become a Data Science champion.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <XPDisplay progress={progress} />
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatsCard
            icon={<Zap className="w-5 h-5 text-yellow-400" />}
            value={progress.totalXP}
            label="Total XP"
            color="yellow"
          />
          <StatsCard
            icon={<Trophy className="w-5 h-5 text-success" />}
            value={progress.completedModules.length}
            label="Levels Complete"
            color="green"
          />
          <StatsCard
            icon={<Star className="w-5 h-5 text-accent" />}
            value={progress.completedChallenges.length}
            label="Challenges Won"
            color="purple"
          />
          <StatsCard
            icon={<Sparkles className="w-5 h-5 text-primary" />}
            value={progress.completedBossFights.length}
            label="Bosses Defeated"
            color="cyan"
          />
        </motion.div>

        {/* Learning Path Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="py-8"
        >
          <h3 className="text-xl font-bold text-center text-foreground mb-8">
            Learning Path
          </h3>
          <LearningPathMap 
            progress={progress} 
            onSelectModule={setSelectedModule}
          />
        </motion.div>
      </main>
    </div>
  );
};

interface StatsCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'yellow' | 'green' | 'purple' | 'cyan';
}

const StatsCard = ({ icon, value, label, color }: StatsCardProps) => {
  const colorClasses = {
    yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
    green: "from-success/20 to-success/5 border-success/30",
    purple: "from-accent/20 to-accent/5 border-accent/30",
    cyan: "from-primary/20 to-primary/5 border-primary/30"
  };

  return (
    <motion.div
      className={cn(
        "p-4 rounded-xl border bg-gradient-to-br",
        colorClasses[color]
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PythonCourse;
