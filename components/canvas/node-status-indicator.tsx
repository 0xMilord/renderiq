'use client';

import { NodeExecutionStatus } from '@/lib/canvas/workflow-executor';
import { NodeStatusManager } from '@/lib/canvas/node-status';
import { Loader2, CheckCircle2, XCircle, Circle, SkipForward } from 'lucide-react';

interface NodeStatusIndicatorProps {
  nodeId: string;
  status: NodeExecutionStatus;
  progress?: number;
  className?: string;
}

export function NodeStatusIndicator({
  nodeId,
  status,
  progress,
  className = '',
}: NodeStatusIndicatorProps) {
  const statusColor = NodeStatusManager.getStatusColor(status);

  const getIcon = () => {
    switch (status) {
      case NodeExecutionStatus.RUNNING:
        return <Loader2 className="h-3 w-3 animate-spin" style={{ color: statusColor }} />;
      case NodeExecutionStatus.COMPLETED:
        return <CheckCircle2 className="h-3 w-3" style={{ color: statusColor }} />;
      case NodeExecutionStatus.ERROR:
        return <XCircle className="h-3 w-3" style={{ color: statusColor }} />;
      case NodeExecutionStatus.SKIPPED:
        return <SkipForward className="h-3 w-3" style={{ color: statusColor }} />;
      default:
        return <Circle className="h-3 w-3" style={{ color: statusColor }} />;
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {getIcon()}
      {progress !== undefined && status === NodeExecutionStatus.RUNNING && (
        <span className="text-xs text-muted-foreground">{progress}%</span>
      )}
    </div>
  );
}

