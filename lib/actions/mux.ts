"use server"

import Mux from "@mux/mux-node"
import jwt from "jsonwebtoken"
import { formatSigningKey } from "@/lib/mux"
import { writeClient } from "@/sanity/lib/client"

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
})

interface CreateUploadResult {
  uploadUrl: string | null
  uploadId: string | null
  error?: string
}

export async function createMuxUploadUrl(): Promise<CreateUploadResult> {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return {
      uploadUrl: null,
      uploadId: null,
      error: "Mux API credentials are not configured"
    }
  }

  try {
    const upload = await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["signed"],
        video_quality: "plus",
        inputs: [
          {
            generated_subtitles: [
              {
                language_code: "en",
                name: "English CC"
              }
            ]
          }
        ]
      }
    })

    return {
      uploadUrl: upload.url,
      uploadId: upload.id
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create upload URL"

    console.error(`Mux upload URL creation error: ${error}`)
    return {
      uploadUrl: null,
      uploadId: null,
      error: errorMessage
    }
  }
}

interface MuxAssetStatus {
  status: "waiting" | "preparing" | "ready" | "errored" | null
  playbackId: string | null
  assetId: string | null
  sanityAssetId: string | null
  error?: string
}

export async function getMuxUploadStatus(
  uploadId: string
): Promise<MuxAssetStatus> {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
    return {
      status: null,
      playbackId: null,
      assetId: null,
      sanityAssetId: null,
      error: "Mux API credentials are not configured"
    }
  }

  try {
    const upload = await mux.video.uploads.retrieve(uploadId)
    const uploadAny = upload as any

    if (uploadAny?.asset?._id) {
      const asset = await mux.video.assets.retrieve(uploadAny.asset_id ?? uploadAny.asset?.id)
      const assetAny = asset as any
      const signedPlayback = assetAny.playback_ids?.find(
        (p: any) => p.policy === "signed"
      )

      if (assetAny.status === "ready" && signedPlayback) {
        const sanityAssetId = crypto.randomUUID()

        await writeClient.createOrReplace({
          _id: sanityAssetId,
          _type: "mux.videoAsset",
          status: assetAny.status,
          assetId: assetAny.id,
          playbackId: signedPlayback.id,
          uploadId: assetAny.upload?._id,
          data: {
            aspect_ratio: assetAny.aspect_ratio,
            created_at: assetAny.created_at,
            duration: assetAny.duration,
            encoding_tier: assetAny.encoding_tier,
            id: assetAny.id,
            ingest_type: assetAny.ingest_type,
            master_access: assetAny.master_access,
            max_resolution_tier: assetAny.max_resolution_tier,
            max_stored_frame_rate: assetAny.max_stored_frame_rate,
            max_stored_resolution: assetAny.max_stored_resolution,
            mp4_support: assetAny.mp4_support,
            passthrough: sanityAssetId,
            playback_ids: assetAny.playback_ids?.map((p: any) => ({
              id: p.id,
              policy: p.policy
            })),
            resolution_tier: assetAny.resolution_tier,
            status: assetAny.status,
            tracks: assetAny.tracks,
            upload_id: assetAny.upload_id,
            video_quality: assetAny.video_quality
          }
        })

        return {
          status: assetAny.status as MuxAssetStatus["status"],
          playbackId: signedPlayback.id,
          assetId: asset.id,
          sanityAssetId
        }
      }

      return {
        status: asset.status as MuxAssetStatus["status"],
        playbackId: signedPlayback?.id ?? null,
        assetId: asset.id,
        sanityAssetId: null
      }
    }

    return {
      status: "waiting",
      playbackId: null,
      assetId: null,
      sanityAssetId: null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to get upload status"

    return {
      status: null,
      playbackId: null,
      assetId: null,
      sanityAssetId: null,
      error: errorMessage
    }
  }
}

interface MuxTokensResult {
  playbackToken: string | null
  thumbnailToken: string | null
  storyboardToken: string | null
  error?: string
  debug?: string
}

export async function getMuxSignedTokens(
  playbackId: string | null | undefined
): Promise<MuxTokensResult> {
  const signingKey = process.env.MUX_SIGNING_KEY
  const signingKeyId = process.env.MUX_SIGNING_KEY_ID

  if (!signingKey || !signingKeyId) {
    return {
      playbackToken: null,
      thumbnailToken: null,
      storyboardToken: null,
      error: "Mux signing keys are not configured",
      debug: `Missing ${!signingKey ? "MUX_SIGNING_KEY" : ""} ${!signingKeyId ? "MUX_SIGNING_KEY_ID" : ""}`.trim()
    }
  }

  if (!playbackId) {
    return {
      playbackToken: null,
      thumbnailToken: null,
      storyboardToken: null,
      error: "playbackId is required"
    }
  }

  try {
    const expirationTime = Math.floor(Date.now() / 1000) + 3600
    const formattedKey = formatSigningKey(signingKey)

    const playbackToken = jwt.sign(
      { sub: playbackId, exp: expirationTime, kid: signingKeyId, aud: "v" },
      formattedKey,
      { algorithm: "RS256" }
    )

    const thumbnailToken = jwt.sign(
      { sub: playbackId, exp: expirationTime, kid: signingKeyId, aud: "t" },
      formattedKey,
      { algorithm: "RS256" }
    )

    const storyboardToken = jwt.sign(
      { sub: playbackId, exp: expirationTime, kid: signingKeyId, aud: "s" },
      formattedKey,
      { algorithm: "RS256" }
    )

    return { playbackToken, thumbnailToken, storyboardToken }
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : "Failed to generate signed tokens"

    return {
      playbackToken: null,
      thumbnailToken: null,
      storyboardToken: null,
      error: errorMessage,
      debug: error instanceof Error ? error.stack : String(error)
    }
  }
}

export async function getMuxSignedToken(
  playbackId: string | null | undefined
): Promise<{ 
  token: string | null 
  error?: string
  debug?: string
}> {
  const result = await getMuxSignedTokens(playbackId)
  return {
    token: result.playbackToken,
    error: result.error,
    debug: result.debug
  }
}