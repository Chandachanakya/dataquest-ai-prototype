import confetti from 'canvas-confetti';

interface ConfettiOptions {
    particleCount?: number;
    spread?: number;
    origin?: { x: number; y: number };
    colors?: string[];
}

class ConfettiManager {
    private defaultColors = ['#22d3ee', '#a855f7', '#10b981', '#f59e0b'];

    /**
     * Trigger confetti celebration
     */
    celebrate(options: ConfettiOptions = {}) {
        const {
            particleCount = 100,
            spread = 70,
            origin = { x: 0.5, y: 0.5 },
            colors = this.defaultColors,
        } = options;

        confetti({
            particleCount,
            spread,
            origin,
            colors,
            ticks: 200,
            gravity: 1,
            decay: 0.94,
            startVelocity: 30,
            scalar: 1,
        });
    }

    /**
     * Quest completion celebration
     */
    questComplete() {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            colors: this.defaultColors,
        };

        function fire(particleRatio: number, opts: any) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio),
            });
        }

        fire(0.25, {
            spread: 26,
            startVelocity: 55,
        });

        fire(0.2, {
            spread: 60,
        });

        fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
        });

        fire(0.1, {
            spread: 120,
            startVelocity: 45,
        });
    }

    /**
     * Level up celebration - fireworks effect
     */
    levelUp() {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 0,
            colors: this.defaultColors,
        };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    /**
     * Streak milestone celebration
     */
    streakMilestone() {
        const end = Date.now() + 1000;
        const colors = ['#22d3ee', '#a855f7'];

        (function frame() {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    /**
     * Badge earned celebration
     */
    badgeEarned() {
        const scalar = 2;
        const emoji = confetti.shapeFromText({ text: '🏆', scalar });

        confetti({
            shapes: [emoji],
            particleCount: 30,
            spread: 100,
            origin: { y: 0.6 },
            scalar,
        });
    }

    /**
     * Clear all confetti
     */
    clear() {
        confetti.reset();
    }
}

// Export singleton instance
export const confettiManager = new ConfettiManager();
