import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatar: string;
  username: string;
  size?: "sm" | "md" | "lg" | "xl";
  rank?: number;
  showGlow?: boolean;
  className?: string;
}

const UserAvatar = ({ 
  avatar, 
  username, 
  size = "md", 
  rank,
  showGlow = false,
  className 
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: "h-8 w-8 text-lg",
    md: "h-12 w-12 text-2xl",
    lg: "h-16 w-16 text-3xl",
    xl: "h-20 w-20 text-4xl",
  };

  const getRankStyles = () => {
    if (!rank) return "";
    switch (rank) {
      case 1:
        return "ring-4 ring-accent shadow-[0_0_20px_hsl(var(--accent)/0.5)] animate-pulse-slow";
      case 2:
        return "ring-3 ring-muted-foreground/60 shadow-[0_0_15px_hsl(var(--muted-foreground)/0.3)]";
      case 3:
        return "ring-2 ring-amber-500/60 shadow-[0_0_12px_hsl(35_92%_50%/0.3)]";
      default:
        return "";
    }
  };

  const getGradientBorder = () => {
    if (rank === 1) return "bg-gradient-to-br from-accent via-primary to-accent";
    if (rank === 2) return "bg-gradient-to-br from-muted-foreground/40 via-muted-foreground/60 to-muted-foreground/40";
    if (rank === 3) return "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600";
    if (showGlow) return "bg-gradient-to-br from-primary/50 via-accent/50 to-primary/50";
    return "bg-border";
  };

  return (
    <div className={cn("relative", className)}>
      {/* Gradient border wrapper */}
      <div className={cn(
        "rounded-full p-0.5",
        getGradientBorder(),
        rank === 1 && "animate-pulse-slow"
      )}>
        <Avatar className={cn(
          sizeClasses[size],
          "border-2 border-background",
          getRankStyles()
        )}>
          <AvatarFallback 
            className={cn(
              "bg-gradient-to-br from-card to-secondary text-foreground font-medium",
              rank === 1 && "from-accent/20 to-primary/20",
              rank === 2 && "from-muted/30 to-muted/50",
              rank === 3 && "from-amber-500/20 to-amber-600/20"
            )}
          >
            {avatar}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Rank badge for top 3 */}
      {rank && rank <= 3 && (
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full flex items-center justify-center text-xs font-bold",
          size === "sm" && "h-4 w-4 text-[10px]",
          size === "md" && "h-5 w-5",
          size === "lg" && "h-6 w-6",
          size === "xl" && "h-7 w-7",
          rank === 1 && "bg-accent text-accent-foreground shadow-[0_0_10px_hsl(var(--accent)/0.5)]",
          rank === 2 && "bg-muted-foreground text-background",
          rank === 3 && "bg-amber-500 text-background"
        )}>
          {rank}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
