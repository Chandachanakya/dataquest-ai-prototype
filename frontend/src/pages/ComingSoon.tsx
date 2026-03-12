import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
        <div className="max-w-md w-full">
            <h1 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">Coming Soon!</h1>
            <p className="text-lg text-muted-foreground mb-8">
                We're working hard to bring you this course. Stay tuned!
            </p>
            <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
            </Button>
        </div>
    </div>
  );
};

export default ComingSoon;
