import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="py-8 bg-background border-t border-border/50">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 opacity-80">
          <img src="/logo.png" alt="DataQuestAI Logo" className="h-6 w-6" />
          <span className="text-sm font-semibold tracking-tight">DataQuestAI</span>
        </div>
        
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </button>
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy
          </button>
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms
          </button>
        </nav>

        <p className="text-xs text-muted-foreground opacity-70">
          All rights reserved @ 2026 DataQuestAI
        </p>
      </div>
    </footer>
  );
};

export default Footer;
