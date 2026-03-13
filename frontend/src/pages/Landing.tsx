import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Zap, Brain } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import Footer from "@/components/Footer";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="container mx-auto flex items-center justify-start">
            <div className="flex items-center gap-2">
                <img src="/logo.png" alt="DataQuestAI Logo" className="h-12 w-12" />
                <h1 className="text-2xl font-bold text-primary">DataQuestAI</h1>
            </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <AnimatedBackground />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium animate-fade-in-down">
              <Sparkles className="h-4 w-4 animate-spin-slow" aria-hidden="true" />
              AI-Powered Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up delay-100">
              <span className="bg-gradient-hero bg-clip-text text-transparent">Gamify Your Data Science Journey</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up delay-200">
              Master data science through AI-powered challenges, adaptive learning paths, and gamified experiences. Level up your skills with personalized quests tailored just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up delay-300">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow hover:scale-105 transition-all duration-300 hover:shadow-lg"
                onClick={() => navigate('/signup')}
                aria-label="Start your learning journey"
              >
                Start Learning
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="hover:scale-105 transition-all duration-300 hover:border-primary/50"
                onClick={() => navigate('/signin')}
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 animate-fade-in-up px-4">
            Why Choose DataQuestAI?
          </h2>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 hover-lift group animate-fade-in-up" style={{ animationDelay: '0ms' }}>
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">AI Personalization</h3>
              <p className="text-muted-foreground">
                Our AI engine recommends quests tailored to your learning style, pace, and goals.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 hover-lift group animate-fade-in-up" style={{ animationDelay: '150ms' }}>
              <div className="bg-accent/10 text-accent p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors duration-300">Gamified Learning</h3>
              <p className="text-muted-foreground">
                Earn XP, unlock badges, and climb the leaderboard as you master new skills.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 hover-lift group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              <div className="bg-success/10 text-success p-3 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-success transition-colors duration-300">Instant Feedback</h3>
              <p className="text-muted-foreground">
                Get real-time feedback on quizzes and code challenges to accelerate your learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto glass-cta rounded-3xl p-8 md:p-14 text-center animate-scale-in transition-all duration-500 relative overflow-hidden group">
            {/* Subtle internal glow decoration */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full group-hover:bg-primary/20 transition-colors duration-700" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 blur-[80px] rounded-full group-hover:bg-accent/20 transition-colors duration-700" />

            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent animate-fade-in-up">
              Ready to Level Up?
            </h2>
            <p className="text-lg md:text-xl mb-10 text-muted-foreground/90 max-w-xl mx-auto animate-fade-in-up delay-100">
              Join thousands of learners mastering data science through AI-powered interactive quests.
            </p>
            <div className="relative inline-block animate-fade-in-up delay-200">
              <Button 
                size="xl" 
                onClick={() => navigate('/signup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_20px_50px_-12px_hsl(180_85%_55%/0.4)] hover:shadow-[0_25px_60px_-12px_hsl(180_85%_55%/0.6)]"
              >
                Get Started Free
              </Button>
              {/* Button shimmer effect hint */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/20" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
