"use client"

import Link from "next/link"
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GatedFallback } from "@/components/courses"
import { useUserTier, hasTierAccess } from "@/lib/hooks/use-user-tier"
import { MuxVideoPlayer } from "./MuxVideoPlayer"
import { LessonContent } from "./LessonContent"
import { LessonCompleteButton } from "./LessonCompleteButton"
import { LessonSidebar } from "./LessonSidebar"
import type { LESSON_BY_ID_QUERYResult } from "@/sanity.types"

// Explicit local types to avoid 'never' types from generated typings
type LessonType = {
  _id: string
  title?: string | null
  description?: string | null
  slug?: { current?: string | null } | null
  content?: any
  video?: { asset?: { playbackId?: string | null } | null } | null
  completedBy?: string[] | null
  courses?: Array<{
    _id: string
    title?: string | null
    slug?: { current?: string | null } | null
    tier?: "free" | "pro" | "ultra" | null
    modules?: Array<{
      _id: string
      title?: string | null
      lessons?: Array<{
        _id: string
        title?: string | null
        slug?: { current?: string | null } | null
        completedBy?: string[] | null
      }> | null
    }> | null
  }> | null
}

interface LessonPageContentProps {
  lesson: LessonType
  userId: string | null
}

export function LessonPageContent({ lesson, userId }: LessonPageContentProps) {
  const userTier = useUserTier()

  const courses = lesson.courses ?? []
  const accessibleCourse = courses.find(course => 
    hasTierAccess(userTier, course.tier)
  )
  const hasAccess = !!accessibleCourse

  const activeCourse = accessibleCourse ?? courses[0]

  const isCompleted = userId
    ? (lesson.completedBy?.includes(userId) ?? false)
    : false

  const modules = activeCourse?.modules
  let prevLesson: { 
    id: string
    slug: string
    title: string
  } | null = null
  let nextLesson: {
    id: string
    slug: string
    title: string
  } | null = null
  const completedLessonIds: string[] = []

  if (modules) {
    const allLessons: Array<{ 
      id: string
      slug: string
      title: string
    }> = []

    for (const module of modules) {
      if (module.lessons) {
        for (const l of module.lessons) {
          allLessons.push({
            id: l._id,
            slug: l.slug!.current!,
            title: l.title ?? "Untitled Lesson"
          })
          if (userId && l.completedBy?.includes(userId)) {
            completedLessonIds.push(l._id)
          }
        }
      }
    }

    const currentIndex = allLessons.findIndex(l => l.id === lesson._id)
    prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
    nextLesson = currentIndex < allLessons.length - 1
      ? allLessons[currentIndex + 1]
      : null
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {activeCourse && hasAccess && (
        <LessonSidebar 
          courseSlug={activeCourse.slug!.current!}
          courseTitle={activeCourse.title ?? null}
          modules={activeCourse.modules ?? null}
          currentLessonId={lesson._id}
          completedLessonIds={completedLessonIds}
        />
      )}

      <div className="flex-1 min-w-0">
        {hasAccess ? (
          <>
            {lesson.video?.asset?.playbackId && (
              <MuxVideoPlayer 
                playbackId={lesson.video?.asset?.playbackId}
                title={lesson.title ?? undefined}
                className="mb-6"
              />
            )}

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {lesson.title ?? "Untitled Lesson"}
                </h1>
                {lesson.description && (
                  <p className="text-zinc-400">{lesson.description}</p>
                )}
              </div>

              {userId && (
                <LessonCompleteButton 
                  lessonId={lesson._id}
                  lessonSlug={lesson.slug!.current!}
                  isCompleted={isCompleted}
                />
              )}
            </div>

            {lesson.content && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 md:p-8 mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Lesson Notes</h2>
                </div>
                <LessonContent content={lesson.content} />
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
              {prevLesson ? (
                <Link
                  href={`/lessons/${prevLesson.slug}`}
                >
                  <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{prevLesson.title}</span>
                    <span className="sm:hidden">Previous</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link
                  href={`/lessons/${nextLesson.slug}`}
                >
                  <Button
                    className="bg-violet-600 hover:bg-violet-500 text-white"
                  >
                    <span className="hidden sm:inline">{nextLesson.title}</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </>
        ) : (
          <GatedFallback requiredTier={activeCourse?.tier} />
        )}
      </div>
    </div>
  )
}