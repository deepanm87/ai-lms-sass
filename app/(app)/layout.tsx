import { ClerkProvider } from "@clerk/nextjs"
import { SanityLive } from "@/sanity/lib/live"
import { TutorWidget } from "@/components/tutor/TutorWidget"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div>{children}</div>
      <SanityLive />
      <TutorWidget />
    </ClerkProvider>
  )
}