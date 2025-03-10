"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase/admin"
import type { SocialMediaWidget, TrackingIntegration } from "@/types/integrations"

// Helper function to check permissions
async function checkPermission(storeId: string, action: string, subject: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { allowed: false, error: "Unauthorized" }
  }

  // Check if user is store owner
  const storeRef = db.collection("stores").doc(storeId)
  const storeDoc = await storeRef.get()

  if (!storeDoc.exists) {
    return { allowed: false, error: "Store not found" }
  }

  const storeData = storeDoc.data()

  // Store owners have all permissions
  if (storeData?.ownerId === session.user.id) {
    return { allowed: true, role: "owner" }
  }

  // Check team membership and role
  const teamMemberRef = storeRef.collection("team").doc(session.user.id)
  const teamMemberDoc = await teamMemberRef.get()

  if (!teamMemberDoc.exists) {
    return { allowed: false, error: "Not a team member" }
  }

  const role = teamMemberDoc.data()?.role

  // Define permissions for each role
  const permissions = {
    owner: ["manage:all"],
    editor: ["create:integrations", "read:integrations", "update:integrations", "delete:integrations"],
    viewer: ["read:integrations"],
  }

  const hasPermission = permissions[role].some((p) => {
    const [permAction, permSubject] = p.split(":")
    return (
      (permAction === "manage" && (permSubject === "all" || permSubject === subject)) ||
      (permAction === action && (permSubject === "all" || permSubject === subject))
    )
  })

  return {
    allowed: hasPermission,
    role,
    error: hasPermission ? null : "Insufficient permissions",
  }
}

// Social Media Widgets
export async function createSocialMediaWidget(
  storeId: string,
  widget: Omit<SocialMediaWidget, "id" | "createdAt" | "updatedAt">,
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    // Process the URL to generate embed code if not provided
    let embedCode = widget.embedCode
    if (!embedCode) {
      embedCode = generateEmbedCode(widget.type, widget.url, {
        width: widget.width,
        height: widget.height,
        autoplay: widget.autoplay,
        loop: widget.loop,
      })
    }

    const widgetRef = await db
      .collection("stores")
      .doc(storeId)
      .collection("widgets")
      .add({
        ...widget,
        embedCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true, id: widgetRef.id }
  } catch (error) {
    console.error("Error creating social media widget:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateSocialMediaWidget(storeId: string, widgetId: string, widget: Partial<SocialMediaWidget>) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    // If URL changed, regenerate embed code
    if (widget.url) {
      const widgetRef = db.collection("stores").doc(storeId).collection("widgets").doc(widgetId)
      const widgetDoc = await widgetRef.get()

      if (widgetDoc.exists) {
        const currentWidget = widgetDoc.data() as SocialMediaWidget

        if (
          currentWidget.url !== widget.url ||
          widget.width ||
          widget.height ||
          widget.autoplay !== undefined ||
          widget.loop !== undefined
        ) {
          widget.embedCode = generateEmbedCode(widget.type || currentWidget.type, widget.url, {
            width: widget.width || currentWidget.width,
            height: widget.height || currentWidget.height,
            autoplay: widget.autoplay !== undefined ? widget.autoplay : currentWidget.autoplay,
            loop: widget.loop !== undefined ? widget.loop : currentWidget.loop,
          })
        }
      }
    }

    await db
      .collection("stores")
      .doc(storeId)
      .collection("widgets")
      .doc(widgetId)
      .update({
        ...widget,
        updatedAt: new Date(),
      })

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true }
  } catch (error) {
    console.error("Error updating social media widget:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteSocialMediaWidget(storeId: string, widgetId: string) {
  try {
    const { allowed, error } = await checkPermission(storeId, "delete", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    await db.collection("stores").doc(storeId).collection("widgets").doc(widgetId).delete()

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting social media widget:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Tracking Integrations
export async function createTrackingIntegration(
  storeId: string,
  integration: Omit<TrackingIntegration, "id" | "storeId" | "createdAt" | "updatedAt">,
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "create", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    // Check if integration already exists
    const existingIntegrationQuery = await db
      .collection("stores")
      .doc(storeId)
      .collection("tracking")
      .where("type", "==", integration.type)
      .get()

    if (!existingIntegrationQuery.empty) {
      // Update existing integration
      const existingDoc = existingIntegrationQuery.docs[0]
      await existingDoc.ref.update({
        ...integration,
        updatedAt: new Date(),
      })

      revalidatePath(`/dashboard/${storeId}/integrations`)
      return { success: true, id: existingDoc.id }
    }

    // Create new integration
    const integrationRef = await db
      .collection("stores")
      .doc(storeId)
      .collection("tracking")
      .add({
        ...integration,
        storeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true, id: integrationRef.id }
  } catch (error) {
    console.error("Error creating tracking integration:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateTrackingIntegration(
  storeId: string,
  integrationId: string,
  integration: Partial<TrackingIntegration>,
) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    await db
      .collection("stores")
      .doc(storeId)
      .collection("tracking")
      .doc(integrationId)
      .update({
        ...integration,
        updatedAt: new Date(),
      })

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true }
  } catch (error) {
    console.error("Error updating tracking integration:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function deleteTrackingIntegration(storeId: string, integrationId: string) {
  try {
    const { allowed, error } = await checkPermission(storeId, "delete", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    await db.collection("stores").doc(storeId).collection("tracking").doc(integrationId).delete()

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting tracking integration:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function toggleTrackingIntegration(storeId: string, integrationId: string, enabled: boolean) {
  try {
    const { allowed, error } = await checkPermission(storeId, "update", "integrations")

    if (!allowed) {
      return { success: false, error }
    }

    await db.collection("stores").doc(storeId).collection("tracking").doc(integrationId).update({
      enabled,
      updatedAt: new Date(),
    })

    revalidatePath(`/dashboard/${storeId}/integrations`)
    return { success: true }
  } catch (error) {
    console.error("Error toggling tracking integration:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Helper function to generate embed code based on URL and type
function generateEmbedCode(
  type: SocialMediaWidget["type"],
  url: string,
  options: {
    width?: string | number
    height?: string | number
    autoplay?: boolean
    loop?: boolean
  } = {},
): string {
  const width = options.width || "100%"
  const height = options.height || "315"
  const autoplay = options.autoplay || false
  const loop = options.loop || false

  switch (type) {
    case "youtube": {
      // Extract video ID from YouTube URL
      const videoId = extractYouTubeVideoId(url)
      if (!videoId) return ""

      return `<iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1" : ""}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    }

    case "twitch": {
      // Extract channel or video ID from Twitch URL
      const { type: twitchType, id } = extractTwitchInfo(url)
      if (!id) return ""

      if (twitchType === "channel") {
        return `<iframe src="https://player.twitch.tv/?channel=${id}&parent=${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "")}" frameborder="0" allowfullscreen="true" scrolling="no" height="${height}" width="${width}"></iframe>`
      } else {
        return `<iframe src="https://player.twitch.tv/?video=${id}&parent=${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "")}" frameborder="0" allowfullscreen="true" scrolling="no" height="${height}" width="${width}"></iframe>`
      }
    }

    case "spotify": {
      // Extract Spotify URI or ID
      const spotifyInfo = extractSpotifyInfo(url)
      if (!spotifyInfo) return ""

      const { type: spotifyType, id } = spotifyInfo

      switch (spotifyType) {
        case "track":
          return `<iframe src="https://open.spotify.com/embed/track/${id}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
        case "album":
          return `<iframe src="https://open.spotify.com/embed/album/${id}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
        case "playlist":
          return `<iframe src="https://open.spotify.com/embed/playlist/${id}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
        case "artist":
          return `<iframe src="https://open.spotify.com/embed/artist/${id}" width="${width}" height="${height}" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
        default:
          return ""
      }
    }

    case "instagram": {
      // For Instagram, we'll just return a link that can be enhanced with Instagram's embed.js
      return `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="width:${width};"></blockquote><script async src="//www.instagram.com/embed.js"></script>`
    }

    case "twitter": {
      // For Twitter, we'll return a link that can be enhanced with Twitter's widgets.js
      return `<blockquote class="twitter-tweet" data-width="${width}"><a href="${url}"></a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`
    }

    case "tiktok": {
      // Extract TikTok video ID
      const tiktokId = extractTikTokId(url)
      if (!tiktokId) return ""

      return `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${tiktokId}" style="width:${width}; height:${height};"><section></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`
    }

    default:
      return ""
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

function extractTikTokId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  return match ? match[1] : null
}

