import { ClerkProvider } from "@clerk/nextjs"
import { SanityLive } from "@/sanity/lib/live"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div>{children}</div>
      <SanityLive />
    </ClerkProvider>
  )
}