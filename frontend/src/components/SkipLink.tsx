import { useEffect, useState } from "react";

const SkipLink = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                setIsVisible(true);
            }
        };

        const handleBlur = () => {
            setIsVisible(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleBlur);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleBlur);
        };
    }, []);

    const skipToMain = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
            main.setAttribute('tabindex', '-1');
            main.focus();
            main.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="skip-links">
            <a
                href="#main-content"
                onClick={skipToMain}
                className={`
          fixed top-0 left-0 z-[9999] px-4 py-2 
          bg-primary text-primary-foreground font-semibold
          transform -translate-y-full transition-transform duration-200
          focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-primary
          ${isVisible ? 'translate-y-0' : ''}
        `}
            >
                Skip to main content
            </a>
        </div>
    );
};

export default SkipLink;
