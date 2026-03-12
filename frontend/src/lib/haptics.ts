interface HapticPattern {
    duration?: number;
    pattern?: number[];
}

class HapticManager {
    private isSupported: boolean;
    private isEnabled: boolean;

    constructor() {
        this.isSupported = 'vibrate' in navigator;
        this.isEnabled = this.loadPreference();
    }

    /**
     * Load user preference from localStorage
     */
    private loadPreference(): boolean {
        const stored = localStorage.getItem('haptics-enabled');
        return stored !== null ? stored === 'true' : true; // Enabled by default
    }

    /**
     * Save user preference to localStorage
     */
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        localStorage.setItem('haptics-enabled', String(enabled));
    }

    /**
     * Check if haptics are enabled
     */
    getEnabled(): boolean {
        return this.isEnabled;
    }

    /**
     * Trigger haptic feedback
     */
    private vibrate(pattern: number | number[]) {
        if (!this.isSupported || !this.isEnabled) return;

        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }

    /**
     * Light tap (button press)
     */
    light() {
        this.vibrate(10);
    }

    /**
     * Medium impact (selection change)
     */
    medium() {
        this.vibrate(20);
    }

    /**
     * Heavy impact (important action)
     */
    heavy() {
        this.vibrate(40);
    }

    /**
     * Success pattern (quest complete)
     */
    success() {
        this.vibrate([10, 50, 10]);
    }

    /**
     * Error pattern (validation failure)
     */
    error() {
        this.vibrate([20, 40, 20, 40, 20]);
    }

    /**
     * Warning pattern
     */
    warning() {
        this.vibrate([30, 100, 30]);
    }

    /**
     * Level up celebration
     */
    levelUp() {
        this.vibrate([30, 50, 30, 50, 50]);
    }

    /**
     * Custom pattern
     */
    custom(pattern: number | number[]) {
        this.vibrate(pattern);
    }

    /**
     * Cancel ongoing vibration
     */
    cancel() {
        if (this.isSupported) {
            navigator.vibrate(0);
        }
    }
}

// Export singleton instance
export const hapticManager = new HapticManager();
