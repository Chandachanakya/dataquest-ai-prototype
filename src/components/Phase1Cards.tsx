import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target } from "lucide-react";
import type { QuestRecommendation, DropRiskAnalysis } from "@/lib/learnerEngine";

interface SmartRecommendationsProps {
    recommendations: QuestRecommendation[];
    onQuestClick: (questId: string) => void;
}

export const SmartRecommendationsCard = ({ recommendations, onQuestClick }: SmartRecommendationsProps) => {
    if (recommendations.length === 0) return null;

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 animate-fade-in-up delay-250 hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Smart Recommendations
                </CardTitle>
                <CardDescription>Quests similar learners enjoyed</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec, index) => (
                        <div
                            key={rec.questId}
                            className="p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors cursor-pointer animate-fade-in-up"
                            onClick={() => onQuestClick(rec.questId)}
                            style={{ animationDelay: `${350 + index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h4 className="font-medium text-sm mb-1">{rec.questTitle}</h4>
                                    <p className="text-xs text-muted-foreground mb-2">{rec.reason}</p>
                                    <div className="flex items-center gap-3 text-xs flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {rec.difficulty}
                                        </Badge>
                                        <span className="text-success">
                                            {Math.round(rec.successRate)}% success
                                        </span>
                                        <span className="text-muted-foreground">
                                            ~{Math.round(rec.estimatedTime / 60)}min
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-primary">
                                        {rec.score.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">score</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

interface DropRiskCardProps {
    analysis: DropRiskAnalysis;
}

export const DropRiskCard = ({ analysis }: DropRiskCardProps) => {
    return (
        <Card className={`animate-fade-in-up delay-300 hover:shadow-md transition-shadow duration-300 ${analysis.riskLevel === 'HIGH' ? 'border-destructive/50 bg-destructive/5' :
                analysis.riskLevel === 'MEDIUM' ? 'border-warning/50 bg-warning/5' :
                    'border-success/50 bg-success/5'
            }`}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Engagement Health
                </CardTitle>
                <CardDescription>
                    Risk Level: <Badge variant={
                        analysis.riskLevel === 'HIGH' ? 'destructive' :
                            analysis.riskLevel === 'MEDIUM' ? 'default' :
                                'outline'
                    } className="ml-1">
                        {analysis.riskLevel}
                    </Badge>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Risk Score Bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className="font-medium">{Math.round(analysis.riskScore * 100)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${analysis.riskLevel === 'HIGH' ? 'bg-destructive' :
                                        analysis.riskLevel === 'MEDIUM' ? 'bg-warning' :
                                            'bg-success'
                                    }`}
                                style={{ width: `${analysis.riskScore * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between p-2 rounded bg-background">
                            <span className="text-muted-foreground">Inactivity</span>
                            <span className="font-medium">{Math.round(analysis.factors.inactivity * 100)}%</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-background">
                            <span className="text-muted-foreground">Declining</span>
                            <span className="font-medium">{Math.round(analysis.factors.declining * 100)}%</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-background">
                            <span className="text-muted-foreground">Incomplete</span>
                            <span className="font-medium">{Math.round(analysis.factors.incomplete * 100)}%</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-background">
                            <span className="text-muted-foreground">Engagement</span>
                            <span className="font-medium">{Math.round(analysis.factors.engagement * 100)}%</span>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {analysis.recommendations.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">💡 Recommendations:</p>
                            <ul className="space-y-1">
                                {analysis.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-muted-foreground">
                                        • {rec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
