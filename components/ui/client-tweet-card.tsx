"use client"

import { memo } from "react"
import { TweetProps, useTweet } from "react-tweet"

import {
  MagicTweet,
  TweetNotFound,
  TweetSkeleton,
} from "@/components/ui/tweet-card"

function ClientTweetCardComponent({
  id,
  apiUrl,
  fallback = <TweetSkeleton />,
  components,
  fetchOptions,
  onError,
  ...props
}: TweetProps & { className?: string }) {
  const { data, error, isLoading } = useTweet(id, apiUrl, fetchOptions)

  if (isLoading) return fallback
  if (error || !data) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    if (onError) {
      onError(error)
    }
    return <NotFound {...props} />
  }

  return <MagicTweet tweet={data} {...props} />
}

// ✅ OPTIMIZED: Memoize component to prevent unnecessary re-renders in lists
export const ClientTweetCard = memo(ClientTweetCardComponent)

