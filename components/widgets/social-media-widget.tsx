"use client"

import { useState, useEffect } from "react"
import { YouTubeEmbed } from "./youtube-embed"
import { TwitchEmbed } from "./twitch-embed"
import { SpotifyEmbed } from "./spotify-embed"
import type { SocialMediaWidget as SocialMediaWidgetType } from "@/types/integrations"

interface SocialMediaWidgetProps {
  widget: SocialMediaWidgetType
  className?: string
}

export function SocialMediaWidget({ widget, className = "" }: SocialMediaWidgetProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div
        style={{ width: widget.width || "100%", height: widget.height || "315px" }}
        className={`bg-muted flex items-center justify-center ${className}`}
      >
        <span className="text-muted-foreground">Loading content...</span>
      </div>
    )
  }

  // If we have a custom embed code, use it
  if (widget.embedCode) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: widget.embedCode }} />
  }

  // Otherwise, use our component-based embeds
  switch (widget.type) {
    case "youtube": {
      const videoId = extractYouTubeVideoId(widget.url)
      if (!videoId) return <div className="text-red-500">Invalid YouTube URL</div>

      return (
        <YouTubeEmbed
          videoId={videoId}
          width={widget.width}
          height={widget.height}
          autoplay={widget.autoplay}
          title={widget.title}
          className={className}
        />
      )
    }

    case "twitch": {
      const { type, id } = extractTwitchInfo(widget.url)
      if (!id) return <div className="text-red-500">Invalid Twitch URL</div>

      return (
        <TwitchEmbed
          channel={type === "channel" ? id : undefined}
          video={type === "video" ? id : undefined}
          width={widget.width}
          height={widget.height}
          autoplay={widget.autoplay}
          className={className}
        />
      )
    }

    case "spotify": {
      const spotifyInfo = extractSpotifyInfo(widget.url)
      if (!spotifyInfo) return <div className="text-red-500">Invalid Spotify URL</div>

      return (
        <SpotifyEmbed
          type={spotifyInfo.type}
          id={spotifyInfo.id}
          width={widget.width}
          height={widget.height}
          className={className}
        />
      )
    }

    default:
      return <div className="text-red-500">Unsupported widget type</div>
  }
}

// Helper functions to extract IDs from URLs
function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

function extractTwitchInfo(url: string): { type: "channel" | "video"; id: string | null } {
  // Channel URL format: https://www.twitch.tv/channelname
  const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)(?!\/)/)
  if (channelMatch) {
    return { type: "channel", id: channelMatch[1] }
  }

  // Video URL format: https://www.twitch.tv/videos/videoId
  const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/)
  if (videoMatch) {
    return { type: "video", id: videoMatch[1] }
  }

  return { type: "channel", id: null }
}

function extractSpotifyInfo(url: string): { type: "track" | "album" | "playlist" | "artist"; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/)
  if (match) {
    return {
      type: match[1] as "track" | "album" | "playlist" | "artist",
      id: match[2],
    }
  }
  return null
}

