'use client';

import { useState } from 'react';
import { useTasks, useTaskCategories, useStreak, useUserTaskStats, useTaskCompletion } from '@/lib/hooks/use-tasks';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { TaskCard } from './task-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Flame, Trophy, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TasksPageClient() {
  const { user } = useUserProfile();
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { categories, loading: categoriesLoading } = useTaskCategories();
  const { streak, loading: streakLoading, updateStreak } = useStreak();
  const { stats, loading: statsLoading } = useUserTaskStats(user?.id);
  const { completeTask, completing, error: completionError } = useTaskCompletion();

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    try {
      const result = await completeTask(taskId);
      if (result?.success) {
        toast.success(
          result.creditsAwarded
            ? `Task completed! You earned ${result.creditsAwarded} credit${result.creditsAwarded !== 1 ? 's' : ''}.`
            : 'Task completed! Verification pending.'
        );
        // Refetch tasks and stats
        refetchTasks();
        if (user?.id) {
          // Stats will auto-refetch via hook
        }
      } else {
        toast.error(result?.error || 'Failed to complete task');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Calculate streak credits display
  const streakCredits = streak
    ? streak.currentStreak <= 7
      ? 1
      : streak.currentStreak <= 30
      ? 2
      : 2
    : 0;
  const cappedStreakCredits = Math.min(streakCredits, 3);

  return (
    <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Earn Credits</h1>
        <p className="text-muted-foreground">
          Complete tasks to earn credits. All tasks happen inside Renderiq.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Streak Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">Login Streak</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">
                  {streak?.currentStreak || 0} day{streak?.currentStreak !== 1 ? 's' : ''}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {streak?.currentStreak ? `+${cappedStreakCredits} credits today` : 'Start your streak!'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">Completed</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.totalCompleted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Tasks completed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Earned Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">Credits Earned</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.totalCreditsEarned || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">From tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      {tasksError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      )}

      {tasksLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tasks available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleCompleteTask(task.id)}
              completing={completingTaskId === task.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
