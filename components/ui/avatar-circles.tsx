import { cn } from "@/lib/utils";
import Image from "next/image";

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
  }>;
  className?: string;
}

export function AvatarCircles({
  numPeople = 0,
  avatarUrls = [],
  className,
}: AvatarCirclesProps) {
  const visibleAvatars = avatarUrls.slice(0, 5);
  const remainingCount = numPeople > visibleAvatars.length ? numPeople - visibleAvatars.length : 0;

  return (
    <div className={cn("flex items-center -space-x-3", className)}>
      {visibleAvatars.map((avatar, index) => (
        <a
          key={index}
          href={avatar.profileUrl || "#"}
          className="relative inline-block rounded-full ring-2 ring-background hover:z-10 transition-transform hover:scale-110"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Image
            src={avatar.imageUrl}
            alt={`User ${index + 1}`}
            width={48}
            height={48}
            className="rounded-full object-cover"
            unoptimized={avatar.imageUrl.includes('dicebear.com')}
          />
        </a>
      ))}
      {remainingCount > 0 && (
        <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full ring-2 ring-background bg-muted text-sm font-medium text-muted-foreground">
          +{formatLargeNumber(remainingCount)}
        </div>
      )}
    </div>
  );
}

