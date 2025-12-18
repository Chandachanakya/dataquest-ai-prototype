import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthProps {
  mode: 'signin' | 'signup';
}

const Auth = ({ mode }: AuthProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!username.trim() || !email.trim() || !password.trim()) {
          toast.error("Please fill in all fields");
          setIsSubmitting(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsSubmitting(false);
          return;
        }

        const { error } = await signUp(email.trim(), password, username.trim());
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
          setIsSubmitting(false);
          return;
        }

        toast.success("Account created! Welcome to DataQuestAI!");
        navigate('/onboarding');
      } else {
        if (!email.trim() || !password.trim()) {
          toast.error("Please fill in all fields");
          setIsSubmitting(false);
          return;
        }

        const { error } = await signIn(email.trim(), password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error("Invalid email or password");
          } else {
            toast.error(error.message);
          }
          setIsSubmitting(false);
          return;
        }

        toast.success("Welcome back!");
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate(mode === 'signup' ? '/signin' : '/signup')}
                className="text-primary hover:underline"
                disabled={isSubmitting}
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
