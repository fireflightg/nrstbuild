"use client"

import { useState, useEffect } from "react"

interface SpotifyEmbedProps {
  type: "track" | "album" | "playlist" | "artist"
  id: string
  width?: string | number
  height?: string | number
  className?: string
}

export function SpotifyEmbed({ type, id, width = "100%", height = "352", className = "" }: SpotifyEmbedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div style={{ width, height }} className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-muted-foreground">Loading Spotify content...</span>
      </div>
    )
  }

  return (
    <iframe
      src={`https://open.spotify.com/embed/${type}/${id}`}
      width={width}
      height={height}
      frameBorder="0"
      allowTransparency={true}
      allow="encrypted-media"
      className={className}
    ></iframe>
  )
}

