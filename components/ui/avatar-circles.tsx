'use client';

import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper function to format large numbers with k/m/b notation
function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

interface AvatarCirclesProps {
  numPeople?: number;
  avatarUrls: Array<{
    imageUrl: string;
    profileUrl?: string;
    userName?: string;
  }>;
  className?: string;
}

export function AvatarCircles({
  numPeople = 0,
  avatarUrls = [],
  className,
}: AvatarCirclesProps) {
  const visibleAvatars = avatarUrls.slice(0, 10);
  const remainingCount = numPeople > visibleAvatars.length ? numPeople - visibleAvatars.length : 0;
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Helper to check if URL is from external storage (Supabase/GCS)
  const isExternalStorageUrl = (url: string) => {
    return url.includes('supabase.co') || 
           url.includes('storage.googleapis.com') || 
           url.includes(process.env.NEXT_PUBLIC_GCS_CDN_DOMAIN || '');
  };

  // Generate fallback initials from user name or email
  const getInitials = (avatar: typeof visibleAvatars[0], index: number) => {
    if (avatar.userName) {
      const parts = avatar.userName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return `U${index + 1}`;
  };

  // Handle image load errors
  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center -space-x-3", className)}>
        {visibleAvatars.map((avatar, index) => {
          const hasError = imageErrors.has(index);
          const isDicebear = avatar.imageUrl.includes('dicebear.com');
          const isGoogle = avatar.imageUrl.includes('googleusercontent.com');
          
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <a
                  href={avatar.profileUrl || "#"}
                  className="relative inline-block rounded-full ring-2 ring-background hover:z-10 transition-transform hover:scale-110"
                  style={{ zIndex: visibleAvatars.length - index }}
                >
                  {hasError ? (
                    // Fallback: Show initials in a colored circle
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary font-semibold text-xs">
                      {getInitials(avatar, index)}
                    </div>
                  ) : isExternalStorageUrl(avatar.imageUrl) ? (
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.userName || `User ${index + 1}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12"
                      loading="lazy"
                      onError={() => handleImageError(index)}
                    />
                  ) : (
                    <Image
                      src={avatar.imageUrl}
                      alt={avatar.userName || `User ${index + 1}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover w-12 h-12"
                      unoptimized={isDicebear || isGoogle}
                      onError={() => handleImageError(index)}
                    />
                  )}
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>{avatar.userName || `User ${index + 1}`}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full ring-2 ring-background bg-muted text-sm font-medium text-muted-foreground cursor-default">
                +{formatLargeNumber(remainingCount)}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{formatLargeNumber(remainingCount)} more users</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

