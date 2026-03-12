import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = "",
}: EmptyStateProps) => {
    return (
        <Card className={`border-dashed ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="rounded-full bg-muted/50 p-6 mb-4 animate-fade-in-up">
                    <Icon className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2 animate-fade-in-up delay-100">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6 animate-fade-in-up delay-200">
                    {description}
                </p>
                {actionLabel && onAction && (
                    <Button
                        onClick={onAction}
                        className="animate-fade-in-up delay-300 hover:scale-105 transition-transform duration-300"
                    >
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default EmptyState;
