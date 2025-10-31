import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { storage } from "@/lib/storage";
import { User } from "@/lib/types";
import { ArrowLeft, Send, Sparkles, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const AIMentor = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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
    const currentUser = storage.getCurrentUser();
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
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
      const progress = storage.getUserProgress();
      const completed = progress.filter(p => p.completed).length;
      
      if (completed === 0) {
        return "🌟 Since you're just starting out, I recommend:\n\n1. **Python Basics** - Build a strong foundation\n2. **SQL Fundamentals** - Learn to work with data\n3. **Data Analysis Basics** - Start analyzing real datasets\n\nThese three quests will give you a solid base for your data science journey!";
      } else if (completed < 5) {
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

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(userMessage.content),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-glow border-primary/20">
          <CardHeader>
            <CardTitle>Your Personal AI Learning Assistant</CardTitle>
            <CardDescription>
              Get personalized guidance, recommendations, and support for your data science journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea ref={scrollRef} className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-muted text-foreground border border-border"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <Sparkles className="h-3 w-3" aria-hidden="true" />
                          <span className="font-medium">AI Mentor</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted border border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your learning journey..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AIMentor;
