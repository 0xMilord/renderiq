'use client';

import { useState } from 'react';
import { useTasks, useTaskCategories, useStreak, useUserTaskStats, useTaskCompletion } from '@/lib/hooks/use-tasks';
import { useUserProfile } from '@/lib/hooks/use-user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Clock, XCircle, Zap, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TasksPageClient() {
  const { user } = useUserProfile();
  const { tasks, loading: tasksLoading, error: tasksError, refetch: refetchTasks } = useTasks();
  const { categories, loading: categoriesLoading } = useTaskCategories();
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


  return (
    <div className="h-full w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Tasks List */}
      {tasksError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      )}

      {tasksLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">No tasks available at the moment.</p>
            {tasksError ? (
              <p className="text-sm text-destructive mt-2">{tasksError}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Tasks may need to be seeded. Run: <code className="px-1 py-0.5 bg-muted rounded text-xs">npm run db:seed-tasks</code>
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px] sm:min-w-[200px]">Task</TableHead>
                  <TableHead className="min-w-[200px] sm:min-w-[250px]">Description</TableHead>
                  <TableHead className="text-center min-w-[80px] sm:min-w-[100px]">Credits</TableHead>
                  <TableHead className="text-center min-w-[100px] hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-center min-w-[120px] sm:min-w-[150px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px] sm:min-w-[120px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                  const isAutomatic = task.verificationType === 'automatic';
                  const isCompletedToday = task.lastCompletedAt && 
                    new Date(task.lastCompletedAt).toDateString() === new Date().toDateString();

                  const getStatusIcon = () => {
                    if (isAutomatic) {
                      if (isCompletedToday) {
                        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                      } else if (task.canComplete) {
                        return <Sparkles className="h-4 w-4 text-blue-500" />;
                      } else {
                        return <Clock className="h-4 w-4 text-yellow-500" />;
                      }
                    } else {
                      if (task.canComplete) {
                        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
                      } else if (task.cooldownRemaining && task.cooldownRemaining > 0) {
                        return <Clock className="h-4 w-4 text-yellow-500" />;
                      } else {
                        return <XCircle className="h-4 w-4 text-gray-400" />;
                      }
                    }
                  };

                  const getStatusText = () => {
                    if (isAutomatic) {
                      if (isCompletedToday) {
                        return 'Completed today';
                      } else if (task.canComplete) {
                        return 'Automatic';
                      } else if (task.cooldownRemaining && task.cooldownRemaining > 0) {
                        return `Available in ${task.cooldownRemaining}h`;
                      } else {
                        return 'Automatic';
                      }
                    } else {
                      if (task.canComplete) {
                        return 'Available';
                      } else if (task.cooldownRemaining && task.cooldownRemaining > 0) {
                        return `Cooldown: ${task.cooldownRemaining}h`;
                      } else if (task.reason) {
                        return task.reason;
                      } else {
                        return 'Unavailable';
                      }
                    }
                  };

                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span>{task.name}</span>
                          {isAutomatic && (
                            <Badge variant="outline" className="text-xs w-fit">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md min-w-[200px] sm:min-w-[250px]">
                          <p className="text-sm text-muted-foreground break-words whitespace-normal">{task.description}</p>
                          {task.instructions && (
                            <p className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">{task.instructions}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="whitespace-nowrap">{task.creditsReward} credit{task.creditsReward !== 1 ? 's' : ''}</Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge variant={isAutomatic ? "default" : "outline"} className="whitespace-nowrap">
                          {isAutomatic ? 'Automatic' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-1 sm:gap-2">
                          {getStatusIcon()}
                          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{getStatusText()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAutomatic ? (
                          <span className="text-xs sm:text-sm text-muted-foreground italic whitespace-nowrap">Auto-completed</span>
                        ) : task.canComplete ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTaskId === task.id}
                            className="whitespace-nowrap"
                          >
                            {completingTaskId === task.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                <span className="hidden sm:inline">Processing...</span>
                              </>
                            ) : (
                              'Complete'
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs sm:text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Info Alert - Moved to bottom */}
      <Alert className="mt-6">
        <AlertDescription>
          <strong>Automatic Tasks:</strong> Tasks marked with "Auto" are completed automatically when you perform the action (e.g., daily login, create render). Manual tasks require you to submit verification.
        </AlertDescription>
      </Alert>
      </div>
    </div>
  );
}
