import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const QuestCardSkeleton = () => {
    return (
        <Card className="animate-pulse">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded" />
                            <Skeleton className="h-6 w-3/4" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
};

export default QuestCardSkeleton;
