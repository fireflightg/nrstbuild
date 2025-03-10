"use client"

import { useState, useEffect } from "react"

interface TwitchEmbedProps {
  channel?: string
  video?: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  className?: string
}

export function TwitchEmbed({
  channel,
  video,
  width = "100%",
  height = "315",
  autoplay = false,
  className = "",
}: TwitchEmbedProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [parentDomain, setParentDomain] = useState("")

  useEffect(() => {
    setIsMounted(true)
    // Extract domain from window.location for the parent parameter
    const domain = window.location.hostname
    setParentDomain(domain)
  }, [])

  if (!isMounted || !parentDomain) {
    return (
      <div style={{ width, height }} className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">Loading Twitch stream...</span>
      </div>
    )
  }

  if (!channel && !video) {
    return (
      <div style={{ width, height }} className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">Missing channel or video ID</span>
      </div>
    )
  }

  const src = channel
    ? `https://player.twitch.tv/?channel=${channel}&parent=${parentDomain}${autoplay ? "&autoplay=true" : ""}`
    : `https://player.twitch.tv/?video=${video}&parent=${parentDomain}${autoplay ? "&autoplay=true" : ""}`

  return <iframe src={src} width={width} height={height} allowFullScreen frameBorder="0" className={className}></iframe>
}

