"use client"

import { useAuth } from "@clerk/nextjs"
import type { Tier } from "@/lib/constants"

export function useUserTier(): Tier {
  const { has } = useAuth()

  if (has?.({ plan: "ultra" })) {
    return "ultra"
  }

  if (has?.({ plan: "pro" })) {
    return "pro"
  }

  return "free"
}

export function hasTierAccess(
  userTier: Tier,
  contentTier: Tier | null | undefined
): boolean {

  if (!contentTier || contentTier === "free") {
    return true
  }

  if (contentTier === "ultra") {
    return userTier === "ultra"
  }

  if (contentTier === "pro") {
    return userTier === "pro" || userTier === "ultra"
  }

}