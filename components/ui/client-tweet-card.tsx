"use client"

import { TweetProps, useTweet } from "react-tweet"

import {
  MagicTweet,
  TweetNotFound,
  TweetSkeleton,
} from "@/components/ui/tweet-card"

export const ClientTweetCard = ({
  id,
  apiUrl,
  fallback = <TweetSkeleton />,
  components,
  fetchOptions,
  onError,
  ...props
}: TweetProps & { className?: string }) => {
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

