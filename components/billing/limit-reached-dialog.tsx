'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UpgradeModal } from './upgrade-modal';
import type { LimitType } from '@/lib/services/plan-limits.service';

interface LimitReachedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: LimitType;
  current: number;
  limit: number | null;
  planName: string;
  message?: string;
  onManage?: () => void; // Callback for "Manage" action (e.g., go to dashboard)
}

export function LimitReachedDialog({
  isOpen,
  onClose,
  limitType,
  current,
  limit,
  planName,
  message,
  onManage,
}: LimitReachedDialogProps) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const getLimitMessage = () => {
    if (message) return message;

    switch (limitType) {
      case 'projects':
        return `You've reached your project limit of ${limit} ${limit === 1 ? 'project' : 'projects'}. Upgrade to create more projects or manage your existing projects.`;
      case 'renders_per_project':
        return `You've reached your render limit of ${limit} ${limit === 1 ? 'render' : 'renders'} per project. Upgrade to create more renders or start a new project.`;
      case 'credits':
        return `You've run out of credits. Upgrade to get more credits or purchase a credit package.`;
      case 'quality':
        return `This quality level requires a Pro plan or higher. Upgrade to access high-quality renders.`;
      case 'video':
        return `Video generation requires a Pro plan or higher. Upgrade to generate videos.`;
      case 'api':
        return `API access requires an Enterprise plan. Upgrade to access the API.`;
      default:
        return 'You\'ve reached a limit. Upgrade to continue.';
    }
  };

  const handleManage = () => {
    if (onManage) {
      onManage();
    } else {
      // Default: navigate to dashboard
      router.push('/dashboard/projects');
    }
    onClose();
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
    // Optionally close the limit dialog after upgrade modal closes
    // onClose();
  };

  const handleUpgradeClick = async (planId: string) => {
    // Navigate to checkout for the selected plan
    router.push(`/payments/create-subscription?planId=${planId}`);
    setShowUpgradeModal(false);
    onClose();
  };

  const handlePurchaseCredits = async (packageId: string) => {
    // Navigate to checkout for the selected credit package
    router.push(`/payments/create-order?packageId=${packageId}`);
    setShowUpgradeModal(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Limit Reached
            </DialogTitle>
            <DialogDescription className="pt-2">
              {getLimitMessage()}
            </DialogDescription>
          </DialogHeader>

          <Alert variant="default" className="mt-4">
            <AlertDescription className="text-sm">
              <strong>Current Plan:</strong> {planName}
              <br />
              <strong>Current Usage:</strong> {current} / {limit === null ? 'Unlimited' : limit}
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-3 mt-6">
            {/* Primary CTA: Upgrade */}
            <Button
              onClick={handleUpgrade}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>

            {/* Secondary CTA: Manage */}
            {(limitType === 'projects' || limitType === 'renders_per_project') && (
              <Button
                onClick={handleManage}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Manage {limitType === 'projects' ? 'Projects' : 'Renders'}
              </Button>
            )}

            {/* For credits, show purchase credits option */}
            {limitType === 'credits' && (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Purchase Credits
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={handleUpgradeModalClose}
        limitType={limitType}
        currentPlan={planName}
        onUpgrade={handleUpgradeClick}
        onPurchaseCredits={handlePurchaseCredits}
      />
    </>
  );
}

