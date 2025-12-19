'use client';

import { AmbassadorReferralBadge } from './ambassador-referral-badge';
import { AmbassadorTierBadge } from './ambassador-tier-badge';
import { CreateLinkButton } from './create-link-button';

export function AmbassadorHeaderContent() {
  return (
    <>
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <AmbassadorReferralBadge />
        <AmbassadorTierBadge />
      </div>
      <CreateLinkButton />
    </>
  );
}
