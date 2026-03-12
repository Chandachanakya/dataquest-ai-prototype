import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quest } from "@/lib/types";
import { BookOpen, Code, Gamepad2, Star, Bookmark, BookmarkCheck, Zap, Flame, Sparkles, Crown, Swords, Target } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";
import { useState } from "react";

interface QuestCardProps {
  quest: Quest;
  isCompleted?: boolean;
  onStart: (questId: string) => void;
}

const QuestCard = ({ quest, isCompleted = false, onStart }: QuestCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-quests') || '[]');
    return bookmarks.includes(quest.id);
  });

  const difficultyColors = {
    beginner: "bg-success/10 text-success border-success/20",
    intermediate: "bg-accent/10 text-accent border-accent/20",
    advanced: "bg-destructive/10 text-destructive border-destructive/20",
    expert: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  const difficultyIcons = {
    beginner: Zap,
    intermediate: Flame,
    advanced: Sparkles,
    expert: Crown,
  };

  const typeIcons = {
    quiz: BookOpen,
    code: Code,
    game: Gamepad2,
  };

  // Derive objective if not provided
  const objective = quest.objective ?? (
    quest.difficulty === 'beginner'
      ? 'Score ≥ 60% to complete'
      : quest.difficulty === 'intermediate'
        ? 'Score ≥ 70% to complete'
        : quest.difficulty === 'advanced'
          ? 'Score ≥ 80% to complete'
          : 'Score ≥ 90% to complete — Expert Challenge!'
  );

  const TypeIcon = typeIcons[quest.type];
  const DifficultyIcon = difficultyIcons[quest.difficulty] ?? Zap;

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bookmarks = JSON.parse(localStorage.getItem('bookmarked-quests') || '[]');
    if (isBookmarked) {
      localStorage.setItem('bookmarked-quests', JSON.stringify(bookmarks.filter((id: string) => id !== quest.id)));
    } else {
      bookmarks.push(quest.id);
      localStorage.setItem('bookmarked-quests', JSON.stringify(bookmarks));
    }
    setIsBookmarked(!isBookmarked);
  };

  return (
    <TooltipProvider>
      <Card className="group hover-lift hover:border-primary/50 animate-fade-in-up transition-all duration-300 overflow-hidden relative">
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />

        {/* Expert shimmer border */}
        {quest.difficulty === 'expert' && (
          <div className="absolute inset-0 rounded-lg ring-1 ring-purple-500/40 pointer-events-none" />
        )}

        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
                <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:scale-110 transition-transform duration-300 shrink-0" aria-hidden="true" />
                <span className="break-words">{quest.title}</span>
                {isCompleted && (
                  <Star className="h-4 w-4 fill-accent text-accent animate-bounce-subtle shrink-0" aria-label="Completed" />
                )}
              </CardTitle>
              <CardDescription className="mt-2 text-sm">{quest.description}</CardDescription>

              {/* Objective line */}
              <div className="flex items-center gap-1.5 mt-2">
                <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">{objective}</span>
              </div>
            </div>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className="ml-2 p-1 rounded-md hover:bg-muted transition-colors focus-ring shrink-0"
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark quest"}
            >
              {isBookmarked
                ? <BookmarkCheck className="h-5 w-5 text-primary fill-primary" />
                : <Bookmark className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />}
            </button>
          </div>

          <div className="flex gap-2 mt-3">
            <Badge
              variant="outline"
              className={`${difficultyColors[quest.difficulty]} transition-all duration-300 group-hover:scale-105 flex items-center gap-1`}
            >
              <DifficultyIcon className="h-3 w-3" aria-hidden="true" />
              {quest.difficulty}
            </Badge>
            <Badge variant="secondary" className="transition-all duration-300 group-hover:scale-105">
              {quest.topic}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* XP badge */}
            <div className="flex items-center gap-2">
              <div className="bg-gradient-xp text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold group-hover:scale-110 transition-transform duration-300 shadow-sm">
                +{quest.xpReward} XP
              </div>
              {quest.difficulty === 'expert' && (
                <span className="text-xs text-purple-400 font-medium">2× XP Multiplier</span>
              )}
            </div>

            {/* CTA */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onStart(quest.id)}
                  variant={isCompleted ? "outline" : "default"}
                  size="sm"
                  className="w-full sm:w-auto group-hover:scale-105 transition-all duration-300 group-hover:shadow-md focus-ring"
                  aria-label={isCompleted ? `Retry ${quest.title}` : `Accept mission: ${quest.title}`}
                >
                  {isCompleted ? (
                    'Retry'
                  ) : (
                    <>
                      <Swords className="h-3.5 w-3.5 mr-1.5" />
                      Accept Mission
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">+{quest.xpReward} XP on completion</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default QuestCard;
