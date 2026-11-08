import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, HelpCircle } from "lucide-react";
import { StateDistribution, LearnerState } from "@/lib/learnerEngine";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIStateVizProps {
    distribution: StateDistribution;
    confidence: number;
    primaryState: LearnerState;
}

const STATE_CONFIG: Record<LearnerState, { label: string; color: string; description: string }> = {
    'NEW_LEARNER': {
        label: 'New Learner',
        color: 'bg-blue-500',
        description: 'Initial onboarding phase. Complete quests to calibrate AI state analysis.'
    },
    'CONSISTENT': {
        label: 'Consistent',
        color: 'bg-green-500',
        description: 'Steady progress with regular activity and stable scores.'
    },
    'FAST': {
        label: 'Fast Learner',
        color: 'bg-purple-500',
        description: 'High performance exceeding typical progression rates.'
    },
    'STRUGGLING': {
        label: 'Needs Review',
        color: 'bg-orange-500',
        description: 'Recent challenges with content or frequent retries detected.'
    },
    'DROP_RISK': {
        label: 'Engagement Risk',
        color: 'bg-red-500',
        description: 'Irregular activity patterns suggesting potential drop-off.'
    }
};

export const AIStateViz = ({ distribution, confidence, primaryState }: AIStateVizProps) => {
    // Sort states by probability desc
    const sortedStates = (Object.entries(distribution) as [LearnerState, number][])
        .sort(([, a], [, b]) => b - a);

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-indigo-500" />
                        AI Analysis
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        <span>Confidence:</span>
                        <span className={cn(
                            "font-bold",
                            confidence > 0.7 ? "text-green-500" : confidence > 0.4 ? "text-yellow-500" : "text-red-500"
                        )}>
                            {(confidence * 100).toFixed(0)}%
                        </span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {sortedStates.map(([state, prob]) => {
                        const config = STATE_CONFIG[state] || STATE_CONFIG['NEW_LEARNER'];
                        const percent = (prob * 100).toFixed(0);
                        const isPrimary = state === primaryState;

                        return (
                            <div key={state} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("font-medium", isPrimary ? "text-foreground" : "text-muted-foreground")}>
                                            {config.label}
                                        </span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="h-3 w-3 text-muted-foreground/50" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="w-[200px] text-xs">{config.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <span className="text-xs font-mono text-muted-foreground">{percent}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full transition-all duration-500 rounded-full", config.color)}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="text-xs text-muted-foreground border-t pt-3 mt-2">
                    <p className="italic">
                        Based on recent performance, persistence, and activity patterns.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
