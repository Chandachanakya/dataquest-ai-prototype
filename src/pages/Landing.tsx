import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Zap, Brain } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" aria-hidden="true"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI-Powered Learning Platform
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Master Skills Through
              <span className="bg-gradient-hero bg-clip-text text-transparent"> AI-Powered Quests</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Level up your coding skills with personalized challenges, real-time feedback, and gamified learning. Join thousands of learners on their quest to mastery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                variant="hero" 
                onClick={() => navigate('/signup')}
                aria-label="Start your learning journey"
              >
                Start Your Journey
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
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
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose DataQuestAI?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 transition-all">
              <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-4">
                <Brain className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Personalization</h3>
              <p className="text-muted-foreground">
                Our AI engine recommends quests tailored to your learning style, pace, and goals.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 transition-all">
              <div className="bg-accent/10 text-accent p-3 rounded-lg w-fit mb-4">
                <Trophy className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gamified Learning</h3>
              <p className="text-muted-foreground">
                Earn XP, unlock badges, and climb the leaderboard as you master new skills.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border-2 border-border hover:border-primary/50 transition-all">
              <div className="bg-success/10 text-success p-3 rounded-lg w-fit mb-4">
                <Zap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
              <p className="text-muted-foreground">
                Get real-time feedback on quizzes and code challenges to accelerate your learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-gradient-hero rounded-2xl p-12 text-center text-white shadow-glow">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Level Up?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join our community and start your learning adventure today. No credit card required.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate('/signup')}
              className="bg-white text-primary hover:bg-white/90"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
