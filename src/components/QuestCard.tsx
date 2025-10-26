import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Quest } from "@/lib/types";
import { BookOpen, Code, Gamepad2, Star } from "lucide-react";

interface QuestCardProps {
  quest: Quest;
  isCompleted?: boolean;
  onStart: (questId: string) => void;
}

const QuestCard = ({ quest, isCompleted = false, onStart }: QuestCardProps) => {
  const difficultyColors = {
    beginner: "bg-success/10 text-success border-success/20",
    intermediate: "bg-accent/10 text-accent border-accent/20",
    advanced: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const typeIcons = {
    quiz: BookOpen,
    code: Code,
    game: Gamepad2,
  };

  const TypeIcon = typeIcons[quest.type];

  return (
    <Card className="hover:shadow-md transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TypeIcon className="h-5 w-5 text-primary" aria-hidden="true" />
              {quest.title}
              {isCompleted && <Star className="h-4 w-4 fill-accent text-accent" aria-label="Completed" />}
            </CardTitle>
            <CardDescription className="mt-2">{quest.description}</CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className={difficultyColors[quest.difficulty]}>
            {quest.difficulty}
          </Badge>
          <Badge variant="secondary">{quest.topic}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-xp text-white px-3 py-1 rounded-full text-sm font-semibold">
              +{quest.xpReward} XP
            </div>
          </div>
          <Button
            onClick={() => onStart(quest.id)}
            variant={isCompleted ? "outline" : "default"}
            size="sm"
            aria-label={isCompleted ? `Retry ${quest.title}` : `Start ${quest.title}`}
          >
            {isCompleted ? "Retry" : "Start Quest"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestCard;
