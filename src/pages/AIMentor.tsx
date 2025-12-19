import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Sparkles, Loader2, Bot, User as UserIcon, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIMentor = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi there! I'm your AI learning mentor. I can help you with:\n\n• Personalized learning path recommendations\n• Topic explanations and study tips\n• Challenge strategies and problem-solving guidance\n• Progress analysis and goal setting\n\nWhat would you like to learn about today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Topic-based responses
    if (lowerMessage.includes("python") || lowerMessage.includes("programming")) {
      return "🐍 Python is a great choice for data science! Here's my advice:\n\n1. **Start with basics**: Focus on variables, data types, and control structures\n2. **Practice with data**: Use libraries like pandas and NumPy early on\n3. **Build projects**: Apply what you learn to real datasets\n\nI recommend starting with our Python Fundamentals quest and then moving to Data Analysis with Pandas. Would you like me to suggest a specific learning path?";
    }
    
    if (lowerMessage.includes("machine learning") || lowerMessage.includes("ml")) {
      return "🤖 Machine Learning is exciting! Here's a roadmap:\n\n1. **Prerequisites**: Strong Python and statistics foundation\n2. **Core concepts**: Supervised vs unsupervised learning, model evaluation\n3. **Algorithms**: Start with linear regression, decision trees, then neural networks\n4. **Practice**: Kaggle competitions and our ML challenges\n\nBased on your current level, I suggest mastering Python basics first, then diving into our Machine Learning Introduction quest.";
    }
    
    if (lowerMessage.includes("sql") || lowerMessage.includes("database")) {
      return "💾 SQL is essential for data science! Here's what to focus on:\n\n1. **SELECT statements**: Querying and filtering data\n2. **JOINs**: Combining data from multiple tables\n3. **Aggregations**: GROUP BY, COUNT, SUM, AVG\n4. **Subqueries**: Advanced data manipulation\n\nTry our SQL Fundamentals quest to get hands-on practice with real-world scenarios!";
    }
    
    if (lowerMessage.includes("visualization") || lowerMessage.includes("chart") || lowerMessage.includes("graph")) {
      return "📊 Data visualization is key to communicating insights! Here's my guidance:\n\n1. **Choose the right chart**: Bar charts for comparisons, line charts for trends, scatter plots for relationships\n2. **Tools**: Start with matplotlib and seaborn in Python\n3. **Design principles**: Keep it simple, use color wisely, tell a story\n\nOur Data Visualization quest covers these concepts with interactive examples!";
    }
    
    if (lowerMessage.includes("help") || lowerMessage.includes("stuck") || lowerMessage.includes("confused")) {
      return "I'm here to help! 💪\n\nTell me more about what you're working on:\n• Which quest or topic are you studying?\n• What specific concept is challenging?\n• Have you tried any approaches so far?\n\nThe more details you share, the better I can guide you!";
    }
    
    if (lowerMessage.includes("recommend") || lowerMessage.includes("next") || lowerMessage.includes("should i learn")) {
      // Fetch user progress from database
      let completedCount = 0;
      if (user) {
        const { data } = await supabase
          .from('user_progress')
          .select('quest_id')
          .eq('user_id', user.id)
          .eq('completed', true);
        completedCount = data?.length || 0;
      }
      
      if (completedCount === 0) {
        return "🌟 Since you're just starting out, I recommend:\n\n1. **Python Basics** - Build a strong foundation\n2. **SQL Fundamentals** - Learn to work with data\n3. **Data Analysis Basics** - Start analyzing real datasets\n\nThese three quests will give you a solid base for your data science journey!";
      } else if (completedCount < 5) {
        return "📈 Great progress! Based on your learning style, I suggest:\n\n1. Continue building Python skills with intermediate challenges\n2. Explore data visualization techniques\n3. Try collaborative challenges in the Forum\n\nYou're on the right track - keep up the momentum!";
      } else {
        return "🚀 You're doing amazing! Time to level up:\n\n1. **Machine Learning** - Start with supervised learning\n2. **Advanced SQL** - Complex queries and optimization\n3. **Real-world Projects** - Apply your skills to Kaggle datasets\n\nYou're ready for more advanced topics. Challenge yourself!";
      }
    }
    
    // Default responses
    const responses = [
      "That's an interesting question! Could you provide more context about what you're trying to learn or achieve?",
      "I'd love to help you with that! Can you tell me which specific area of data science you're focusing on?",
      "Great question! To give you the best guidance, could you share:\n• Your current skill level\n• What you're trying to accomplish\n• Any specific challenges you're facing",
      "I'm here to support your learning journey! Let me know if you'd like recommendations on:\n• Learning paths\n• Specific topics (Python, SQL, ML, etc.)\n• Study strategies\n• Challenge tips",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const responseContent = await generateAIResponse(userMessage.content);
    
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
              AI Mentor
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-5xl">
        <Card className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] flex flex-col shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 animate-fade-in-up">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-slow" />
                  <div className="relative bg-gradient-hero p-3 rounded-full">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Your Personal AI Learning Assistant</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Get personalized guidance, recommendations, and support
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="hidden sm:flex items-center gap-1 border-primary/30">
                <Sparkles className="h-3 w-3 text-primary" />
                AI Powered
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea ref={scrollRef} className="flex-1 p-4 sm:p-6 bg-gradient-to-b from-background via-background to-muted/20">
              <div className="space-y-4 sm:space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {message.role === "assistant" && (
                      <div className="shrink-0">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                          <div className="relative bg-gradient-hero p-2 rounded-full">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-primary">AI Mentor</span>
                          <Badge variant="outline" className="text-xs py-0 h-4 border-primary/30">
                            Assistant
                          </Badge>
                        </div>
                      )}
                      {message.role === "user" && profile && (
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Badge variant="default" className="text-xs py-0 h-4">
                            You
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground">{profile.username}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-md transition-all duration-300 ${
                          message.role === "user"
                            ? "bg-gradient-hero text-white hover:shadow-lg"
                            : "bg-card text-foreground border-2 border-primary/20 hover:border-primary/30"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                          {message.content}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground px-2">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.role === "user" && profile && (
                      <div className="shrink-0">
                        <UserAvatar 
                          avatar={profile.avatar} 
                          username={profile.username}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start gap-3 sm:gap-4 animate-fade-in-up">
                    <div className="shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                        <div className="relative bg-gradient-hero p-2 rounded-full">
                          <Bot className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-card border-2 border-primary/20">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                        <span className="font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 sm:p-6 border-t border-border bg-card/50 backdrop-blur-sm">
              <div className="flex gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about your learning journey..."
                    className="pr-10 h-11 sm:h-12 text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="bg-gradient-hero text-white hover:shadow-lg hover:scale-105 transition-all duration-300 px-4 sm:px-6"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span className="hidden sm:inline ml-2">Send</span>
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send
                </p>
                <p className="text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> for new line
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AIMentor;
