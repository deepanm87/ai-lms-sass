import { auth } from "@clerk/nextjs/server"
import type { Tier } from "@/lib/constants"

export async function hasAccessToTier(
  requiredTier: Tier | null | undefined
): Promise<boolean> {

  if (!requiredTier || requiredTier === "free") {
    return true
  }

  const { has } = await auth()

  if (requiredTier === "ultra") {
    return has({ plan: "ultra" })
  }

  if (requiredTier === "pro") {
    return has({ plan: "pro" }) || has({ plan: "ultra" })
  }

  return false
}

export async function getUserTier(): Promise<Tier> {
  const { has } = await auth()

  if (has({ plan: "ultra" })) {
    return "ultra"
  }

  if (has({ plan: "pro" })) {
    return "pro"
  }

  return "free"
}