import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ArrowLeft, Send, Sparkles, Loader2, Bot, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import UserAvatar from "@/components/UserAvatar";
import { getGroqChatCompletion } from "@/lib/groq";
import { Message } from "@/lib/types";

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const responseContent = await getGroqChatCompletion(newMessages);
    
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
