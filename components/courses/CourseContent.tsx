"use client"

import { useAuth } from "@clerk/nextjs"
import { CourseHero } from "./CourseHero"
import { ModuleAccordion } from "./ModuleAccordion"
import { CourseCompleteButton } from "./CourseCompleteButton"
import { GatedFallback } from "./GatedFallback"
import { useUserTier, hasTierAccess } from "@/lib/hooks/use-user-tier"
import type { COURSE_WITH_MODULES_QUERYResult } from "@/sanity.types"
import { Skeleton } from "@/components/ui/skeleton"

// Explicit local types to avoid generated 'never' issues
type Lesson = {
  _id: string
  completedBy?: string[] | null
}

type Module = {
  _id: string
  lessons?: Lesson[] | null
}

type Course = {
  _id: string
  title?: string | null
  description?: string | null
  tier?: "free" | "pro" | "ultra" | null
  thumbnail?: any
  category?: any
  moduleCount?: number | null
  lessonCount?: number | null
  modules?: Module[] | null
  completedBy?: string[] | null
  slug?: { current?: string | null } | null
}

interface CourseContentProps {
  course: Course
  userId: string | null
}

export function CourseContent({ course, userId }: CourseContentProps) {
  const { isLoaded: isAuthLoaded } = useAuth()
  const userTier = useUserTier()

  const hasAccess = hasTierAccess(userTier, course.tier)

  let totalLessons = 0
  let completedLessons = 0

  for (const m of course.modules ?? []) {
    for (const l of m.lessons ?? []) {
      totalLessons++
      if (userId && l.completedBy?.includes(userId)) {
        completedLessons++
      }
    }
  }

  const isCourseCompleted = userId
    ? (course.completedBy?.includes(userId) ?? false)
    : false

    if (!isAuthLoaded) {
      return <Skeleton className="w-full h-full" />
    }

    return (
      <>
        <CourseHero 
          title={course.title ?? null}
          description={course.description ?? null}
          tier={course.tier ?? null}
          thumbnail={course.thumbnail}
          category={course.category}
          moduleCount={course.moduleCount ?? null}
          lessonCount={course.lessonCount ?? null}
        />

        {hasAccess ? (
          <div className="space-y-8">
            {userId && (
              <CourseCompleteButton 
                courseId={course._id}
                courseSlug={course.slug!.current!}
                isCompleted={isCourseCompleted}
                completedLessons={completedLessons}
                totalLessons={totalLessons}
              />
            )}

            <ModuleAccordion 
              modules={course.modules ?? null}
              userId={userId}
            />
          </div>
        ) : (
          <GatedFallback requiredTier={course.tier} /> 
        )}
      </>
    )
}