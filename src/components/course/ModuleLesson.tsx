import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Lightbulb, Code2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Module, LessonContent } from "@/lib/pythonCourseData";
import { cn } from "@/lib/utils";

interface ModuleLessonProps {
  module: Module;
  onComplete: () => void;
  onVideoWatched?: (moduleId: number) => void;
  isVideoWatched?: boolean;
}

export const ModuleLesson = ({ module, onComplete, onVideoWatched, isVideoWatched = false }: ModuleLessonProps) => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [videoMarkedAsWatched, setVideoMarkedAsWatched] = useState(isVideoWatched);

  // Total steps: 3 lessons + 1 video (if videoUrl exists)
  const totalSteps = module.lessons.length + (module.videoUrl ? 1 : 0);
  const isOnVideoStep = currentLesson === module.lessons.length;
  const lesson = !isOnVideoStep ? module.lessons[currentLesson] : null;

  const handleNext = () => {
    if (currentLesson < totalSteps - 1) {
      setCurrentLesson(prev => prev + 1);
    } else {
      // Mark video as watched if on video step
      if (isOnVideoStep && !videoMarkedAsWatched && onVideoWatched) {
        onVideoWatched(module.id);
        setVideoMarkedAsWatched(true);
      }
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(prev => prev - 1);
    }
  };

  const handleMarkVideoWatched = () => {
    if (onVideoWatched && !videoMarkedAsWatched) {
      onVideoWatched(module.id);
      setVideoMarkedAsWatched(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <BookOpen className="w-3 h-3 mr-1" />
          {isOnVideoStep ? `Video Tutorial` : `Lesson ${currentLesson + 1} of ${module.lessons.length}`}
        </Badge>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "w-8 h-1 rounded-full transition-colors",
                idx <= currentLesson ? "bg-primary" : "bg-muted"
              )}
              layoutId={`lesson-progress-${idx}`}
            />
          ))}
        </div>
      </div>

      {/* Lesson or Video Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLesson}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {isOnVideoStep && module.videoUrl ? (
            // Video Step
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    module.color
                  )}>
                    <Play className="w-6 h-6" />
                  </span>
                  Video Tutorial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={module.videoUrl}
                    title={`${module.title} Video Tutorial`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>

                {!videoMarkedAsWatched && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Watch the video to reinforce your learning. Click below when you're done!
                    </p>
                    <Button
                      onClick={handleMarkVideoWatched}
                      variant="outline"
                      className="w-full"
                    >
                      Mark as Watched
                    </Button>
                  </div>
                )}

                {videoMarkedAsWatched && (
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-success font-medium">
                      ✓ Video watched! Great job reinforcing your knowledge.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : lesson ? (
            // Lesson Step
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    module.color
                  )}>
                    {module.icon}
                  </span>
                  {lesson.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-foreground leading-relaxed whitespace-pre-line">
                    {lesson.content.split('\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h4 key={idx} className="font-bold text-primary mt-4 mb-2">
                            {paragraph.replace(/\*\*/g, '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('- ')) {
                        return (
                          <li key={idx} className="text-muted-foreground ml-4">
                            {paragraph.replace('- ', '')}
                          </li>
                        );
                      }
                      return <p key={idx} className="mb-2">{paragraph}</p>;
                    })}
                  </div>
                </div>

                {/* Code Example */}
                {lesson.codeExample && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Code2 className="w-4 h-4" />
                      Code Example
                    </div>
                    <pre className="bg-background/50 border border-border rounded-lg p-4 overflow-x-auto">
                      <code className="text-sm text-foreground font-mono">
                        {lesson.codeExample}
                      </code>
                    </pre>
                  </div>
                )}

                {/* Tips */}
                {lesson.tips && lesson.tips.length > 0 && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-accent mb-2">
                      <Lightbulb className="w-4 h-4" />
                      Pro Tips
                    </div>
                    <ul className="space-y-1">
                      {lesson.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-accent">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentLesson === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
        >
          {currentLesson === totalSteps - 1 ? (
            "Start Challenge"
          ) : (
            <>
              {isOnVideoStep ? "Continue" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
