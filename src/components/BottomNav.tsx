import { useNavigate, useLocation } from "react-router-dom";
import { Home, Trophy, BarChart3, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { icon: Home, label: "Home", path: "/dashboard" },
        { icon: GraduationCap, label: "Courses", path: "/courses" },
        { icon: Sparkles, label: "AI Mentor", path: "/ai-mentor" },
        { icon: BarChart3, label: "Analytics", path: "/analytics" },
        { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-lg border-t border-border shadow-lg pb-safe"
            style={{
                position: 'fixed',
                willChange: 'transform',
                transform: 'translateZ(0)',
            }}
            role="navigation"
            aria-label="Bottom navigation"
        >
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-300 min-w-[56px] active:scale-95",
                            isActive(path)
                                ? "text-primary bg-primary/10 scale-105"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        aria-label={label}
                        aria-current={isActive(path) ? "page" : undefined}
                    >
                        <Icon
                            className={cn(
                                "h-5 w-5 transition-transform duration-300",
                                isActive(path) && "scale-110"
                            )}
                            aria-hidden="true"
                        />
                        <span className="text-[10px] font-medium leading-tight">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
