import { useEffect, useRef, RefObject } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onSwipe?: (direction: SwipeDirection) => void;
}

interface SwipeOptions {
    threshold?: number; // Minimum distance for swipe (px)
    velocityThreshold?: number; // Minimum velocity (px/ms)
    preventDefaultTouchmoveEvent?: boolean;
}

export function useSwipeGesture(
    ref: RefObject<HTMLElement>,
    handlers: SwipeHandlers,
    options: SwipeOptions = {}
) {
    const {
        threshold = 50,
        velocityThreshold = 0.3,
        preventDefaultTouchmoveEvent = false,
    } = options;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now(),
            };
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (preventDefaultTouchmoveEvent && touchStart.current) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - touchStart.current.x);
                const deltaY = Math.abs(touch.clientY - touchStart.current.y);

                // Prevent default if horizontal swipe is detected
                if (deltaX > deltaY && deltaX > 10) {
                    e.preventDefault();
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart.current) return;

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStart.current.x;
            const deltaY = touch.clientY - touchStart.current.y;
            const deltaTime = Date.now() - touchStart.current.time;

            const velocityX = Math.abs(deltaX) / deltaTime;
            const velocityY = Math.abs(deltaY) / deltaTime;

            // Determine swipe direction
            let direction: SwipeDirection | null = null;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
                    direction = deltaX > 0 ? 'right' : 'left';
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
                    direction = deltaY > 0 ? 'down' : 'up';
                }
            }

            // Call appropriate handler
            if (direction) {
                handlers.onSwipe?.(direction);

                switch (direction) {
                    case 'left':
                        handlers.onSwipeLeft?.();
                        break;
                    case 'right':
                        handlers.onSwipeRight?.();
                        break;
                    case 'up':
                        handlers.onSwipeUp?.();
                        break;
                    case 'down':
                        handlers.onSwipeDown?.();
                        break;
                }
            }

            touchStart.current = null;
        };

        // Mouse events for desktop testing
        let mouseStart: { x: number; y: number; time: number } | null = null;

        const handleMouseDown = (e: MouseEvent) => {
            mouseStart = {
                x: e.clientX,
                y: e.clientY,
                time: Date.now(),
            };
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!mouseStart) return;

            const deltaX = e.clientX - mouseStart.x;
            const deltaY = e.clientY - mouseStart.y;
            const deltaTime = Date.now() - mouseStart.time;

            const velocityX = Math.abs(deltaX) / deltaTime;
            const velocityY = Math.abs(deltaY) / deltaTime;

            let direction: SwipeDirection | null = null;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > threshold && velocityX > velocityThreshold) {
                    direction = deltaX > 0 ? 'right' : 'left';
                }
            } else {
                if (Math.abs(deltaY) > threshold && velocityY > velocityThreshold) {
                    direction = deltaY > 0 ? 'down' : 'up';
                }
            }

            if (direction) {
                handlers.onSwipe?.(direction);

                switch (direction) {
                    case 'left':
                        handlers.onSwipeLeft?.();
                        break;
                    case 'right':
                        handlers.onSwipeRight?.();
                        break;
                    case 'up':
                        handlers.onSwipeUp?.();
                        break;
                    case 'down':
                        handlers.onSwipeDown?.();
                        break;
                }
            }

            mouseStart = null;
        };

        // Add event listeners
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mouseup', handleMouseUp);

        // Cleanup
        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mouseup', handleMouseUp);
        };
    }, [ref, handlers, threshold, velocityThreshold, preventDefaultTouchmoveEvent]);
}
