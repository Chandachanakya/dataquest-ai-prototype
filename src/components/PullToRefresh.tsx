import { useState, useEffect, useCallback, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: ReactNode;
    threshold?: number;
    className?: string;
}

const PullToRefresh = ({
    onRefresh,
    children,
    threshold = 80,
    className = ""
}: PullToRefreshProps) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only trigger if scrolled to top
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
        }
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (startY === 0 || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;

        // Only pull down, not up
        if (distance > 0 && window.scrollY === 0) {
            setPullDistance(Math.min(distance, threshold * 1.5));

            // Prevent default scroll behavior when pulling
            if (distance > 10) {
                e.preventDefault();
            }
        }
    }, [startY, threshold, isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }
        setPullDistance(0);
        setStartY(0);
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    useEffect(() => {
        const element = document.getElementById('pull-to-refresh-container');
        if (!element) return;

        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const pullProgress = Math.min(pullDistance / threshold, 1);
    const showRefreshIndicator = pullDistance > 0 || isRefreshing;

    return (
        <div id="pull-to-refresh-container" className={className}>
            {/* Pull indicator */}
            <div
                className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center transition-all duration-300"
                style={{
                    height: showRefreshIndicator ? '60px' : '0px',
                    opacity: showRefreshIndicator ? 1 : 0,
                    transform: `translateY(${Math.min(pullDistance - 60, 0)}px)`,
                }}
            >
                <div className="bg-card border border-border rounded-full p-3 shadow-lg glass-card">
                    {isRefreshing ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                        <div
                            className="h-5 w-5 border-2 border-primary rounded-full transition-transform duration-300"
                            style={{
                                transform: `rotate(${pullProgress * 360}deg)`,
                                borderTopColor: pullProgress >= 1 ? 'hsl(var(--primary))' : 'transparent',
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                className="transition-transform duration-300"
                style={{
                    transform: isRefreshing ? 'translateY(60px)' : `translateY(${Math.min(pullDistance * 0.5, 30)}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
