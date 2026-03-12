import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

interface AuthProps {
  mode: 'signin' | 'signup';
}

const Auth = ({ mode }: AuthProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // New state for confirmation visibility

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
        if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
          toast.error("Please fill in all fields");
          setIsSubmitting(false);
          return;
        }

        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) { // Check if passwords match
          toast.error("Passwords do not match");
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

  // ... (getPasswordStrength function remains the same) ...
    const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' };
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: 'bg-destructive' };
    if (pwd.length < 8) return { strength: 2, label: 'Fair', color: 'bg-accent' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { strength: 4, label: 'Strong', color: 'bg-success' };
    }
    return { strength: 3, label: 'Good', color: 'bg-primary' };
  };

  const passwordStrength = mode === 'signup' ? getPasswordStrength(password) : null;


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <AnimatedBackground />
      
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20 bg-card/95 backdrop-blur-sm relative z-10 animate-fade-in-up">
        <CardHeader className="text-center space-y-2 pb-6">
          {/* ... (Card Header content remains the same) ... */}
            <div className="mx-auto mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-hero rounded-full blur-xl opacity-30 animate-pulse-slow" />
              <div className="relative bg-gradient-hero p-4 rounded-full w-16 h-16 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent animate-fade-in-up delay-100">
            DataQuestAI
          </CardTitle>
          <CardDescription className="text-base animate-fade-in-up delay-150">
            {mode === 'signup' ? 'Create your account to start learning' : 'Welcome back! Sign in to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="space-y-2 animate-fade-in-up delay-200">
                {/* ... (Username input remains the same) ... */}
                <Label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    aria-required="true"
                    disabled={isSubmitting}
                    className="pl-10 transition-all duration-300 focus:border-primary focus:ring-primary/20"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
            
            <div className="space-y-2 animate-fade-in-up delay-300">
              {/* ... (Email input remains the same) ... */}
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-required="true"
                  disabled={isSubmitting}
                  className="pl-10 transition-all duration-300 focus:border-primary focus:ring-primary/20"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-up delay-400">
                {/* ... (Password input remains the same) ... */}
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === 'signup' ? "At least 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-required="true"
                  disabled={isSubmitting}
                  className="pl-10 pr-10 transition-all duration-300 focus:border-primary focus:ring-primary/20"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* New "Confirm Password" field for signup */}
            {mode === 'signup' && (
              <div className="space-y-2 animate-fade-in-up delay-500">
                <Label htmlFor="confirm-password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-required="true"
                    disabled={isSubmitting}
                    className="pl-10 pr-10 transition-all duration-300 focus:border-primary focus:ring-primary/20"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Password strength indicator for signup */}
            {mode === 'signup' && password.length > 0 && passwordStrength && (
              <div className="space-y-1.5 animate-fade-in-up">
                {/* ... (Password strength indicator content remains the same) ... */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength:</span>
                    <span className={`font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    />
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  )}
              </div>
            )}

            <Button 
              type="submit" 
              variant="hero" 
              className="w-full mt-6 animate-fade-in-up delay-600 hover:scale-105 transition-transform duration-300 shadow-md hover:shadow-lg" 
              size="lg" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                </>
              )}
            </Button>

            <div className="text-center text-sm pt-2 animate-fade-in-up delay-700">
              {/* ... (Switch mode button remains the same) ... */}
                <button
                type="button"
                onClick={() => navigate(mode === 'signup' ? '/signin' : '/signup')}
                className="text-primary hover:underline hover:text-primary/80 transition-colors duration-200 font-medium"
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
