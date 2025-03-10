"use client"

import { useState, useEffect } from "react"

interface YouTubeEmbedProps {
  videoId: string
  width?: string | number
  height?: string | number
  autoplay?: boolean
  title?: string
  className?: string
}

export function YouTubeEmbed({
  videoId,
  width = "100%",
  height = "315",
  autoplay = false,
  title = "YouTube video player",
  className = "",
}: YouTubeEmbedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div style={{ width, height }} className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">Loading YouTube video...</span>
      </div>
    )
  }

  return (
    <iframe
      width={width}
      height={height}
      src={`https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1" : ""}`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className={className}
    ></iframe>
  )
}

