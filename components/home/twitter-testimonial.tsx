'use client';

import { useEffect, useState, useMemo } from 'react';
import { ExternalLink, Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  url: string;
  metrics: {
    likes: number;
    retweets: number;
    replies?: number;
  };
}

interface TwitterTestimonialProps {
  tweetUrl: string;
  fallback?: {
    text: string;
    author: string;
    username: string;
  };
}

export function TwitterTestimonial({ tweetUrl, fallback }: TwitterTestimonialProps) {
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Extract tweet ID and username from URL
    // Support both twitter.com and x.com URLs
    const tweetIdMatch = tweetUrl.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
    if (!tweetIdMatch) {
      setError(true);
      setLoading(false);
      return;
    }

    const username = tweetIdMatch[1];
    const tweetId = tweetIdMatch[2];

    // Fetch tweet data from API route
    fetch(`/api/twitter/tweet/${tweetId}?username=${encodeURIComponent(username)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setTweet(data.data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tweetUrl]);

  if (loading) {
    return (
      <Card className="p-4 border border-border/50 rounded-2xl bg-card">
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-48 mt-3" />
          </div>
        </div>
      </Card>
    );
  }

  // ✅ REACT 19 OPTIMIZED: Memoize derived values
  const displayTweet = useMemo(() => {
    return tweet || (fallback ? {
      id: 'fallback',
      text: fallback.text,
      author: {
        name: fallback.author,
        username: fallback.username,
        avatar: '',
      },
      createdAt: new Date().toISOString(),
      url: tweetUrl,
      metrics: {
        likes: 0,
        retweets: 0,
      },
    } : null);
  }, [tweet, fallback, tweetUrl]);

  const timeAgo = useMemo(() => {
    if (!displayTweet) return '';
    return formatDistanceToNow(new Date(displayTweet.createdAt), { addSuffix: true });
  }, [displayTweet]);

  if (!displayTweet) return null;

  return (
    <Card className="p-4 border border-border/50 rounded-2xl bg-card hover:border-border hover:shadow-md transition-all duration-200 group cursor-pointer">
      <a
        href={displayTweet.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={displayTweet.author.avatar || `https://unavatar.io/twitter/${displayTweet.author.username}`} 
                alt={displayTweet.author.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                {displayTweet.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Tweet Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className="font-bold text-foreground text-[15px] leading-5 hover:underline truncate">
                  {displayTweet.author.name}
                </span>
                <span className="text-[15px] text-muted-foreground truncate">
                  @{displayTweet.author.username}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-[15px] text-muted-foreground hover:underline">
                  {timeAgo}
                </span>
              </div>
              <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                <FaXTwitter className="h-4 w-4" />
              </div>
            </div>

            {/* Tweet Text */}
            <div className="mb-3">
              <p className="text-[15px] text-foreground leading-[20px] whitespace-pre-wrap break-words">
                {displayTweet.text}
              </p>
            </div>

            {/* Tweet Actions */}
            <div className="flex items-center justify-between text-muted-foreground pt-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(displayTweet.url, '_blank');
                }}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group/action"
              >
                <MessageCircle className="h-[18.75px] w-[18.75px] group-hover/action:fill-blue-500" />
                <span className="text-[13px] leading-4">{displayTweet.metrics.replies || 0}</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex items-center gap-1.5 hover:text-green-500 transition-colors group/action"
              >
                <Repeat2 className="h-[18.75px] w-[18.75px] group-hover/action:fill-green-500" />
                <span className="text-[13px] leading-4">{displayTweet.metrics.retweets}</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex items-center gap-1.5 hover:text-red-500 transition-colors group/action"
              >
                <Heart className="h-[18.75px] w-[18.75px] group-hover/action:fill-red-500" />
                <span className="text-[13px] leading-4">{displayTweet.metrics.likes}</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(displayTweet.url, '_blank');
                }}
                className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group/action"
              >
                <Share2 className="h-[18.75px] w-[18.75px]" />
              </button>
            </div>
          </div>
        </div>
      </a>
    </Card>
  );
}


