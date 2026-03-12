import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CodeChallenge } from "@/lib/types";
import { CheckCircle2, Play, XCircle } from "lucide-react";

interface CodeEditorProps {
  challenge: CodeChallenge;
  onComplete: (success: boolean) => void;
}

const CodeEditor = ({ challenge, onComplete }: CodeEditorProps) => {
  const [code, setCode] = useState(challenge.starterCode);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runCode = () => {
    // Mock code execution - in production, would use a sandboxed environment or Web Workers
    const results = challenge.testCases.map((testCase, index) => {
      // Simple mock validation - checks if code contains expected patterns
      const codeContainsReturn = code.toLowerCase().includes('return');
      const passed = codeContainsReturn; // Simplified check
      
      return {
        passed,
        message: testCase.description || `Test case ${index + 1}: ${passed ? "Passed ✓" : "Failed ✗"}`,
      };
    });

    setTestResults(results);
    setHasRun(true);

    const allPassed = results.every(r => r.passed);
    if (allPassed) {
      setTimeout(() => onComplete(true), 1500);
    }
  };

  const allTestsPassed = hasRun && testResults.every(r => r.passed);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Code Challenge</CardTitle>
        <CardDescription>{challenge.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code-editor" className="text-sm font-medium">Your Code:</label>
          <Textarea
            id="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-sm min-h-[300px] bg-secondary"
            placeholder="Write your code here..."
            aria-label="Code editor"
          />
        </div>

        <Button onClick={runCode} variant="success" className="w-full">
          <Play className="h-4 w-4 mr-2" aria-hidden="true" />
          Run Code
        </Button>

        {hasRun && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Test Results:</h3>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  result.passed ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                {result.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-success" aria-label="Passed" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" aria-label="Failed" />
                )}
                <span className={result.passed ? "text-success" : "text-destructive"}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {allTestsPassed && (
          <div className="p-4 bg-success/10 rounded-lg border-2 border-success">
            <p className="text-success font-semibold">
              🎉 All tests passed! Quest completing...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeEditor;
