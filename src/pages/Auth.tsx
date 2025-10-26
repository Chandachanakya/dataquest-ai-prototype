import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { toast } from "sonner";
import { User } from "@/lib/types";

interface AuthProps {
  mode: 'signin' | 'signup';
}

const Auth = ({ mode }: AuthProps) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (!username.trim() || !email.trim() || !password.trim()) {
        toast.error("Please fill in all fields");
        return;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: username.trim(),
        avatar: "🎓",
        level: 1,
        xp: 0,
        totalXP: 0,
        streak: 0,
        badges: [],
        completedQuests: 0,
        preferences: {
          learningStyle: 'visual',
          difficulty: 'beginner',
          topics: [],
        },
      };

      storage.setCurrentUser(newUser);
      toast.success("Account created! Welcome to DataQuestAI!");
      navigate('/onboarding');
    } else {
      if (!email.trim() || !password.trim()) {
        toast.error("Please fill in all fields");
        return;
      }

      // Mock signin - in production would validate against backend
      const mockUser: User = {
        id: `user-${Date.now()}`,
        username: email.split('@')[0],
        avatar: "🎓",
        level: 1,
        xp: 0,
        totalXP: 0,
        streak: 0,
        badges: [],
        completedQuests: 0,
        preferences: {
          learningStyle: 'visual',
          difficulty: 'beginner',
          topics: [],
        },
      };

      storage.setCurrentUser(mockUser);
      toast.success("Welcome back!");
      
      if (storage.isOnboardingComplete()) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            DataQuestAI
          </CardTitle>
          <CardDescription>
            {mode === 'signup' ? 'Create your account to start learning' : 'Welcome back! Sign in to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg">
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate(mode === 'signup' ? '/signin' : '/signup')}
                className="text-primary hover:underline"
              >
                {mode === 'signup' 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
