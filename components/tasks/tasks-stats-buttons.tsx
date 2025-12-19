'use client';

import { useStreak, useUserTaskStats } from '@/lib/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Flame, Trophy, CreditCard } from 'lucide-react';
import { useState } from 'react';

export function TasksStatsButtons() {
  const { streak, loading: streakLoading } = useStreak();
  const { stats, loading: statsLoading } = useUserTaskStats();
  const [openDialog, setOpenDialog] = useState<'streak' | 'completed' | 'credits' | null>(null);

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
    <div className="flex items-center gap-2 shrink-0">
      {/* Streak Button */}
      <Dialog open={openDialog === 'streak'} onOpenChange={(open) => setOpenDialog(open ? 'streak' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 h-auto py-2 px-3">
            <Flame className="h-4 w-4 text-orange-500" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Login Streak</div>
              {streakLoading ? (
                <Skeleton className="h-4 w-12 mt-1" />
              ) : (
                <div className="text-sm font-semibold">
                  {streak?.currentStreak || 0} day{streak?.currentStreak !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Login Streak
            </DialogTitle>
            <DialogDescription>
              Your daily login streak and rewards
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {streakLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {streak?.currentStreak || 0} day{streak?.currentStreak !== 1 ? 's' : ''}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {streak?.currentStreak ? `+${cappedStreakCredits} credits today` : 'Start your streak!'}
                  </p>
                </div>
                {streak && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Longest Streak:</span>
                      <span className="font-semibold">{streak.longestStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Login Days:</span>
                      <span className="font-semibold">{streak.totalLoginDays}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completed Button */}
      <Dialog open={openDialog === 'completed'} onOpenChange={(open) => setOpenDialog(open ? 'completed' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 h-auto py-2 px-3">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Completed</div>
              {statsLoading ? (
                <Skeleton className="h-4 w-12 mt-1" />
              ) : (
                <div className="text-sm font-semibold">{stats?.totalCompleted || 0}</div>
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tasks Completed
            </DialogTitle>
            <DialogDescription>
              Total number of tasks you've completed
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalCompleted || 0}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Credits Earned Button */}
      <Dialog open={openDialog === 'credits'} onOpenChange={(open) => setOpenDialog(open ? 'credits' : null)}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2 h-auto py-2 px-3">
            <CreditCard className="h-4 w-4 text-green-500" />
            <div className="text-left">
              <div className="text-xs text-muted-foreground">Credits Earned</div>
              {statsLoading ? (
                <Skeleton className="h-4 w-12 mt-1" />
              ) : (
                <div className="text-sm font-semibold">{stats?.totalCreditsEarned || 0}</div>
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              Credits Earned
            </DialogTitle>
            <DialogDescription>
              Total credits earned from completing tasks
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {statsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="text-3xl font-bold">{stats?.totalCreditsEarned || 0}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

