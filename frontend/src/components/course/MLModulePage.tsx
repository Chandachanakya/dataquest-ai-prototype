import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Zap, Sword, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Module, CourseProgress, mlModules } from "@/lib/mlCourseData";
import { ModuleLesson } from "./ModuleLesson";
import { KnowledgeCheck } from "./KnowledgeCheck";
import { BossFight } from "./BossFight";
import { XPDisplay } from "./XPDisplay";
import { cn } from "@/lib/utils";

interface MLModulePageProps {
  module: Module;
  progress: CourseProgress;
  onBack: () => void;
  onChallengeComplete: (challengeId: string, xp: number) => void;
  onBossComplete: (moduleId: number, xp: number) => void;
}

export const MLModulePage = ({
  module,
  progress,
  onBack,
  onChallengeComplete,
  onBossComplete
}: MLModulePageProps) => {
  const [activeTab, setActiveTab] = useState("lesson");
  const isBossCompleted = progress.completedBossFights.includes(module.id);

  const handleLessonComplete = () => {
    setActiveTab("challenge");
  };

  const handleChallengesComplete = () => {
    setActiveTab("boss");
  };

  const handleBossComplete = (xp: number) => {
    onBossComplete(module.id, xp);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className={cn(
        "sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        "border-border"
      )}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <Map className="w-4 h-4" />
                Map
              </Button>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-3xl p-2 rounded-xl bg-gradient-to-br",
                  module.color
                )}>
                  {module.icon}
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">Level {module.id}</p>
                  <h1 className="text-xl font-bold text-foreground">{module.title}</h1>
                </div>
              </div>
            </div>
          </div>

          {/* XP Display */}
          <div className="mt-4">
            <XPDisplay progress={progress} modules={mlModules} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Quest Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mb-8 p-6 rounded-2xl border-2",
              "bg-gradient-to-r from-card via-card to-background",
              "border-violet-500/30 shadow-[0_0_30px_hsl(280_100%_60%/0.2)]"
            )}
          >
            <div className="flex items-center gap-2 text-violet-500 text-sm font-medium mb-2">
              <Sword className="w-4 h-4" />
              Current Quest
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {module.questName}
            </h2>
            <p className="text-muted-foreground">
              {module.questDescription}
            </p>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="lesson" className="gap-2 data-[state=active]:bg-violet-500/20">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Lessons</span>
              </TabsTrigger>
              <TabsTrigger value="challenge" className="gap-2 data-[state=active]:bg-pink-500/20">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Challenges</span>
              </TabsTrigger>
              <TabsTrigger value="boss" className="gap-2 data-[state=active]:bg-rose-500/20">
                <Sword className="w-4 h-4" />
                <span className="hidden sm:inline">Boss Fight</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lesson" className="mt-6">
              <ModuleLesson
                module={module}
                onComplete={handleLessonComplete}
              />
            </TabsContent>

            <TabsContent value="challenge" className="mt-6">
              <KnowledgeCheck
                module={module}
                completedChallenges={progress.completedChallenges}
                onChallengeComplete={onChallengeComplete}
                onAllComplete={handleChallengesComplete}
              />
            </TabsContent>

            <TabsContent value="boss" className="mt-6">
              <BossFight
                module={module}
                isCompleted={isBossCompleted}
                onComplete={handleBossComplete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </motion.div>
  );
};
