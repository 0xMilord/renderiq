'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Twitter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/);
    if (!tweetIdMatch) {
      setError(true);
      setLoading(false);
      return;
    }

    const tweetId = tweetIdMatch[1];

    // Fetch tweet data (you'll need to implement this API route)
    fetch(`/api/twitter/tweet/${tweetId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
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
      <Card className="p-6">
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-10 w-24" />
      </Card>
    );
  }

  if (error && fallback) {
    return (
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
          <Twitter className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-foreground mb-4 leading-relaxed">{fallback.text}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{fallback.author}</p>
                <p className="text-sm text-muted-foreground">@{fallback.username}</p>
              </div>
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                View Tweet
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!tweet) return null;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <Twitter className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-foreground mb-4 leading-relaxed">{tweet.text}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-foreground">{tweet.author.name}</p>
                <p className="text-sm text-muted-foreground">@{tweet.author.username}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{tweet.metrics.likes} likes</span>
                <span>{tweet.metrics.retweets} retweets</span>
              </div>
            </div>
            <a
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-sm"
            >
              View Tweet
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}


