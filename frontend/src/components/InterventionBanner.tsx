import { useState } from 'react';
import { X, Zap, Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type InterventionPayload, logInterventionEvent } from '@/lib/interventionEngine';

interface InterventionBannerProps {
    userId: string;
    dropoutProbability: number;
    payload: InterventionPayload;
    onAccept: (payload: InterventionPayload) => void;
    onDismiss: () => void;
}

const CASE_CONFIG = {
    LOW_XP_VELOCITY: {
        icon: Zap,
        gradient: 'from-amber-500/20 to-yellow-500/10',
        border: 'border-amber-500/30',
        iconColor: 'text-amber-500',
        badgeText: '2× XP',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    SLOW_COMPLETION: {
        icon: Timer,
        gradient: 'from-blue-500/20 to-cyan-500/10',
        border: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        badgeText: 'Warm-Up',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    LOW_COMPLETION_RATE: {
        icon: Target,
        gradient: 'from-purple-500/20 to-violet-500/10',
        border: 'border-purple-500/30',
        iconColor: 'text-purple-400',
        badgeText: 'Guided Mode',
        badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
};

const InterventionBanner = ({
    userId, dropoutProbability, payload, onAccept, onDismiss,
}: InterventionBannerProps) => {
    const [loading, setLoading] = useState(false);
    const config = CASE_CONFIG[payload.case];
    const Icon = config.icon;

    const handleAccept = async () => {
        setLoading(true);
        await logInterventionEvent(userId, payload.case, dropoutProbability, true);
        onAccept(payload);
        setLoading(false);
    };

    const handleDismiss = async () => {
        await logInterventionEvent(userId, payload.case, dropoutProbability, false);
        onDismiss();
    };

    // Parse bold markdown in message
    const renderMessage = (msg: string) => {
        const parts = msg.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1
                ? <strong key={i} className="font-semibold text-foreground">{part}</strong>
                : <span key={i}>{part}</span>
        );
    };

    return (
        <Card
            className={`relative border bg-gradient-to-br ${config.gradient} ${config.border} 
        animate-fade-in-up transition-all duration-300 mt-4`}
            role="alert"
            aria-live="polite"
        >
            <CardContent className="p-4">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted/50 transition-colors"
                    aria-label="Dismiss intervention"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <div className={`mt-0.5 p-2 rounded-full bg-background/50`}>
                        <Icon className={`h-5 w-5 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Smart Suggestion
                            </span>
                            <Badge variant="outline" className={`text-xs ${config.badgeClass}`}>
                                {config.badgeText}
                            </Badge>
                            {payload.enableHints && (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/30">
                                    Hints On
                                </Badge>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {renderMessage(payload.message)}
                        </p>

                        <Button
                            size="sm"
                            className="mt-3 h-8 text-xs font-semibold"
                            onClick={handleAccept}
                            disabled={loading}
                        >
                            {loading ? 'Loading…' : payload.cta}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default InterventionBanner;
