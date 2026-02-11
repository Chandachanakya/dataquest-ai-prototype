import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  Code2,
  Brain,
  BarChart3,
  Database,
  BookOpen,
  Clock,
  CheckCircle2,
  Play
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  levels: number;
  completedLevels: number;
  duration: string;
  topics: string[];
  color: string;
}

const courses: Course[] = [
  {
    id: 'python',
    title: 'Python for Data Science',
    description: 'Master Python fundamentals, data structures, and libraries like NumPy and Pandas for data manipulation.',
    icon: <Code2 className="h-8 w-8" />,
    difficulty: 'beginner',
    levels: 12,
    completedLevels: 5,
    duration: '8 hours',
    topics: ['Variables & Types', 'Data Structures', 'Functions', 'NumPy', 'Pandas', 'Data Cleaning'],
    color: 'from-primary to-primary/60'
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    description: 'Learn supervised and unsupervised learning algorithms, model evaluation, and practical ML applications.',
    icon: <Brain className="h-8 w-8" />,
    difficulty: 'intermediate',
    levels: 15,
    completedLevels: 3,
    duration: '12 hours',
    topics: ['Linear Regression', 'Classification', 'Clustering', 'Neural Networks', 'Model Evaluation', 'Feature Engineering'],
    color: 'from-accent to-accent/60'
  },
  {
    id: 'visualization',
    title: 'Data Visualization',
    description: 'Create compelling visualizations with Matplotlib, Seaborn, and modern interactive charting libraries.',
    icon: <BarChart3 className="h-8 w-8" />,
    difficulty: 'beginner',
    levels: 10,
    completedLevels: 8,
    duration: '6 hours',
    topics: ['Matplotlib', 'Seaborn', 'Plotly', 'Chart Types', 'Storytelling', 'Dashboards'],
    color: 'from-success to-success/60'
  },
  {
    id: 'sql',
    title: 'SQL & Databases',
    description: 'Query databases effectively, understand relational models, and optimize your data retrieval skills.',
    icon: <Database className="h-8 w-8" />,
    difficulty: 'intermediate',
    levels: 14,
    completedLevels: 0,
    duration: '10 hours',
    topics: ['SELECT Queries', 'JOINs', 'Aggregations', 'Subqueries', 'Indexing', 'Query Optimization'],
    color: 'from-yellow-500 to-yellow-500/60'
  }
];

const difficultyConfig = {
  beginner: { label: 'Beginner', className: 'bg-success/20 text-success border-success/30' },
  intermediate: { label: 'Intermediate', className: 'bg-accent/20 text-accent border-accent/30' },
  advanced: { label: 'Advanced', className: 'bg-destructive/20 text-destructive border-destructive/30' }
};

const Courses = () => {
  const navigate = useNavigate();
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);

  const getProgressPercentage = (completed: number, total: number) => {
    return Math.round((completed / total) * 100);
  };

  const handleCourseClick = (courseId: string) => {
    let path = '';
    switch (courseId) {
      case 'python':
        path = '/courses/python';
        break;
      case 'ml':
        path = '/courses/machine-learning';
        break;
      case 'visualization':
        path = '/courses/data-visualization';
        break;
      case 'sql':
        path = '/courses/sql';
        break;
      default:
        return;
    }
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-primary">Courses</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto animate-fade-in-up px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Data Science Learning Path
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            Master data science from fundamentals to advanced techniques with our interactive levels.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in-up delay-100">
          <Card className="text-center p-3 sm:p-4 hover-lift transition-all duration-300">
            <p className="text-2xl sm:text-3xl font-bold text-primary">51</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Levels</p>
          </Card>
          <Card className="text-center p-3 sm:p-4 hover-lift transition-all duration-300">
            <p className="text-2xl sm:text-3xl font-bold text-success">16</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
          </Card>
          <Card className="text-center p-3 sm:p-4 hover-lift transition-all duration-300">
            <p className="text-2xl sm:text-3xl font-bold text-accent">36h</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Duration</p>
          </Card>
          <Card className="text-center p-3 sm:p-4 hover-lift transition-all duration-300">
            <p className="text-2xl sm:text-3xl font-bold text-foreground">31%</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Overall Progress</p>
          </Card>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {courses.map((course, index) => {
            const progress = getProgressPercentage(course.completedLevels, course.levels);
            const isHovered = hoveredCourse === course.id;

            return (
              <Card
                key={course.id}
                className={`relative overflow-hidden transition-all duration-300 cursor-pointer border-2 animate-fade-in-up ${isHovered ? 'border-primary shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50'
                  }`}
                style={{ animationDelay: `${200 + index * 100}ms` }}
                onMouseEnter={() => setHoveredCourse(course.id)}
                onMouseLeave={() => setHoveredCourse(null)}
                onClick={() => handleCourseClick(course.id)}
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${course.color}`} />

                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${course.color} text-primary-foreground`}>
                      {course.icon}
                    </div>
                    <Badge
                      variant="outline"
                      className={difficultyConfig[course.difficulty].className}
                    >
                      {difficultyConfig[course.difficulty].label}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl mt-4">{course.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {course.completedLevels} of {course.levels} levels
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {course.duration}
                      </span>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Topics covered
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {course.topics.slice(0, 4).map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="text-xs px-2 py-0.5"
                        >
                          {topic}
                        </Badge>
                      ))}
                      {course.topics.length > 4 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          +{course.topics.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mt-2 group"
                    variant={progress > 0 ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCourseClick(course.id);
                    }}
                  >
                    <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    {progress === 0 ? 'Start Course' : progress === 100 ? 'Review Course' : 'Continue Learning'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Courses;
