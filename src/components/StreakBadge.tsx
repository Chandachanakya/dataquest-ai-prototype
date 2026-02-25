import { useState } from 'react';
import { Flame, Snowflake, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useStreakFreeze, MILESTONE_REWARDS, type StreakStatus } from '@/lib/streakService';

interface StreakBadgeProps {
    userId: string;
    status: StreakStatus;
    onFreezeUsed?: () => void;
}

const MILESTONES = Object.keys(MILESTONE_REWARDS).map(Number).sort((a, b) => a - b);

const StreakBadge = ({ userId, status, onFreezeUsed }: StreakBadgeProps) => {
    const { toast } = useToast();
    const [freezeUsed, setFreezeUsed] = useState(false);

    const nextMilestone = MILESTONES.find(m => m > status.current) ?? null;
    const isMilestone = MILESTONES.includes(status.current);

    const handleFreeze = async () => {
        const ok = await useStreakFreeze(userId);
        if (ok) {
            setFreezeUsed(true);
            onFreezeUsed?.();
            toast({ title: '🧊 Streak Freeze activated!', description: 'Your streak is protected for 1 missed day.' });
        } else {
            toast({ title: 'No freeze available', description: 'Earn one by hitting a streak milestone.', variant: 'destructive' });
        }
    };

    return (
        <TooltipProvider>
            <div className="flex items-center gap-2">
                {/* Main streak pill */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                cursor-default select-none transition-all duration-300
                ${isMilestone
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md animate-pulse'
                                    : status.current >= 7
                                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/30'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            aria-label={`${status.current}-day streak`}
                        >
                            <Flame className={`h-4 w-4 ${status.current > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
                            <span>{status.current}-Day Streak</span>
                            {isMilestone && <Trophy className="h-3.5 w-3.5 text-yellow-200" />}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p className="font-semibold">🔥 {status.current} days active</p>
                        {nextMilestone && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {nextMilestone - status.current} days to {nextMilestone}-day milestone (+{MILESTONE_REWARDS[nextMilestone]} XP!)
                            </p>
                        )}
                        {isMilestone && (
                            <p className="text-xs text-green-400 mt-1">
                                🎉 Milestone reached! +{MILESTONE_REWARDS[status.current]} XP bonus
                            </p>
                        )}
                    </TooltipContent>
                </Tooltip>

                {/* Freeze button */}
                {status.freezeAvailable && !freezeUsed && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                                onClick={handleFreeze}
                                aria-label="Use streak freeze"
                            >
                                <Snowflake className="h-3.5 w-3.5 mr-1" />
                                Freeze
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">Protect your streak for 1 missed day</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    );
};

export default StreakBadge;
