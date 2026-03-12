import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestion } from "@/lib/types";
import { CheckCircle2, XCircle } from "lucide-react";

interface QuizViewProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

const QuizView = ({ questions, onComplete }: QuizViewProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const isCorrect = selectedAnswer === question.correctAnswer;

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    setShowFeedback(true);
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(score + (isCorrect ? 1 : 0));
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardDescription>Question {currentQuestion + 1} of {questions.length}</CardDescription>
          <CardDescription>Score: {score}/{questions.length}</CardDescription>
        </div>
        <CardTitle className="text-xl">{question.question}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedAnswer?.toString()} 
          onValueChange={(val) => !showFeedback && setSelectedAnswer(parseInt(val))}
          className="space-y-3"
        >
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 border-2 rounded-lg p-4 transition-all ${
                showFeedback
                  ? index === question.correctAnswer
                    ? "border-success bg-success/5"
                    : index === selectedAnswer
                    ? "border-destructive bg-destructive/5"
                    : "border-border"
                  : selectedAnswer === index
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem 
                value={index.toString()} 
                id={`option-${index}`} 
                disabled={showFeedback}
                className="mt-0.5"
              />
              <Label 
                htmlFor={`option-${index}`} 
                className="flex-1 cursor-pointer text-base font-normal"
              >
                {option}
              </Label>
              {showFeedback && index === question.correctAnswer && (
                <CheckCircle2 className="h-5 w-5 text-success" aria-label="Correct answer" />
              )}
              {showFeedback && index === selectedAnswer && index !== question.correctAnswer && (
                <XCircle className="h-5 w-5 text-destructive" aria-label="Incorrect answer" />
              )}
            </div>
          ))}
        </RadioGroup>

        {showFeedback && (
          <div className={`p-4 rounded-lg ${isCorrect ? "bg-success/10" : "bg-destructive/10"}`}>
            <p className={`font-semibold ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </p>
            <p className="text-sm mt-1 text-foreground">
              {isCorrect 
                ? "Great job! You got it right." 
                : `The correct answer is: ${question.options[question.correctAnswer]}`
              }
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {!showFeedback ? (
            <Button 
              onClick={handleSubmit} 
              disabled={selectedAnswer === null}
              variant="default"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} variant="default">
              {isLastQuestion ? "Complete Quest" : "Next Question"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizView;
