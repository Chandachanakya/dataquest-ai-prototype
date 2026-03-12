import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Award } from "lucide-react";
import type { QuestSequence, DifficultyRecommendation } from "@/lib/learnerEngine";

interface LearningPathCardProps {
    sequences: QuestSequence[];
    onQuestClick: (questId: string) => void;
}

export const LearningPathCard = ({ sequences, onQuestClick }: LearningPathCardProps) => {
    if (sequences.length === 0) return null;

    return (
        <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20 animate-fade-in-up delay-200 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Your Optimal Learning Path
                </CardTitle>
                <CardDescription>AI-recommended quest sequence based on your progress</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {sequences.slice(0, 3).map((seq, index) => (
                        <div
                            key={seq.questId}
                            className="p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors cursor-pointer animate-fade-in-up"
                            onClick={() => onQuestClick(seq.questId)}
                            style={{ animationDelay: `${300 + index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                                        <h4 className="font-medium text-sm">{seq.questTitle}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{seq.reason}</p>
                                    <div className="flex items-center gap-3 text-xs flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {seq.difficulty}
                                        </Badge>
                                        <span className="text-primary flex items-center gap-1">
                                            <Zap className="h-3 w-3" />
                                            Q-Value: {seq.qValue.toFixed(1)}
                                        </span>
                                        <span className="text-muted-foreground">
                                            Expected: +{Math.round(seq.expectedReward)} pts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    💡 Powered by Q-learning algorithm
                </p>
            </CardContent>
        </Card>
    );
};

interface AdaptiveDifficultyCardProps {
    recommendation: DifficultyRecommendation;
}

export const AdaptiveDifficultyCard = ({ recommendation }: AdaptiveDifficultyCardProps) => {
    const { level, confidence, reason, recentPerformance } = recommendation;

    const levelColors = {
        beginner: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
        intermediate: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
        advanced: 'bg-red-500/10 border-red-500/30 text-red-500'
    };

    const trendIcons = {
        improving: '📈',
        stable: '➡️',
        declining: '📉'
    };

    return (
        <Card className={`animate-fade-in-up delay-250 hover:shadow-md transition-shadow duration-300 ${levelColors[level]}`}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Adaptive Difficulty
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                    <CardDescription className="mb-0">
                        Recommended Level:
                    </CardDescription>
                    <Badge variant="outline">
                        {level.toUpperCase()}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Confidence Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Confidence</span>
                            <span className="font-medium">{Math.round(confidence * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${confidence * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="p-3 rounded-lg bg-background/50">
                        <p className="text-sm">{reason}</p>
                    </div>

                    {/* Recent Performance */}
                    <div>
                        <p className="text-sm font-medium mb-2">Recent Performance</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="flex flex-col items-center p-2 rounded bg-background">
                                <span className="text-muted-foreground">Success Rate</span>
                                <span className="font-bold text-lg">{Math.round(recentPerformance.successRate * 100)}%</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-background">
                                <span className="text-muted-foreground">Avg Score</span>
                                <span className="font-bold text-lg">{Math.round(recentPerformance.avgScore)}</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-background">
                                <span className="text-muted-foreground">Trend</span>
                                <span className="font-bold text-lg">{trendIcons[recentPerformance.trend]}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        🎯 Adjusts based on your last 5 quests
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
