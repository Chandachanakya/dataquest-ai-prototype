import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: "primary" | "accent" | "success";
    className?: string;
}

const FloatingActionButton = ({
    icon: Icon,
    label,
    onClick,
    variant = "primary",
    className,
}: FloatingActionButtonProps) => {
    const variantStyles = {
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl",
        accent: "bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 text-accent-foreground shadow-lg hover:shadow-2xl shadow-accent/50",
        success: "bg-success hover:bg-success/90 text-success-foreground shadow-lg hover:shadow-xl",
    };

    return (
        <Button
            onClick={onClick}
            aria-label={label}
            className={cn(
                "fixed bottom-20 right-4 lg:bottom-6 lg:right-6 h-14 w-14 rounded-full p-0 z-[90] transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm",
                variantStyles[variant],
                className
            )}
        >
            <Icon className="h-6 w-6 animate-pulse" aria-hidden="true" />
            <span className="sr-only">{label}</span>
        </Button>
    );
};

export default FloatingActionButton;
