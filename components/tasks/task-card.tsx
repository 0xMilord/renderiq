'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, XCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AvailableTask } from '@/lib/services/tasks.service';

interface TaskCardProps {
  task: AvailableTask;
  onComplete?: () => void;
  completing?: boolean;
}

export function TaskCard({ task, onComplete, completing }: TaskCardProps) {
  const getStatusIcon = () => {
    if (completing) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (!task.canComplete) {
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
    return <Sparkles className="h-4 w-4 text-primary" />;
  };

  const getStatusBadge = () => {
    if (completing) {
      return <Badge variant="secondary">Processing...</Badge>;
    }
    if (!task.canComplete) {
      return (
        <Badge variant="outline" className="text-xs">
          {task.reason || 'Unavailable'}
        </Badge>
      );
    }
    return <Badge variant="default">{task.creditsReward} credit{task.creditsReward !== 1 ? 's' : ''}</Badge>;
  };

  return (
    <Card className="group/card hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h3 className="font-semibold text-sm leading-tight">{task.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.instructions && (
          <p className="text-xs text-muted-foreground mb-3">{task.instructions}</p>
        )}
        {task.cooldownRemaining && task.cooldownRemaining > 0 && (
          <p className="text-xs text-muted-foreground mb-3">
            Available in {task.cooldownRemaining} hour{task.cooldownRemaining !== 1 ? 's' : ''}
          </p>
        )}
        {task.canComplete && onComplete && (
          <Button
            size="sm"
            variant="outline"
            onClick={onComplete}
            disabled={completing}
            className="w-full"
          >
            {completing ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Task'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
