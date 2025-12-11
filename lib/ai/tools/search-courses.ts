import { tool } from "ai"
import { z } from "zod"
import { defineQuery } from "next-sanity"
import { sanityFetch } from "@/sanity/lib/live"

const ALL_COURSES_WITH_CONTENT_QUERY = defineQuery(`*[
  _type == "courses"
] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  description,
  tier,
  "category": category->title,
  modules[]-> {
    _id,
    title,
    description,
    lessons[]-> {
      _id,
      title,
      "slug": slug.current,
      description,
      "contentText": pt::text(content)
    }
  }
}`)

const courseSearchSchema = z.object({
  query: z
    .string()
    .describe("The topic, skill, technology, or learning goal the user wants to learn about")
})

interface Lesson {
  _id: string
  title: string
  slug: string | null
  description: string | null
  contextText: string | null
}

interface Module {
  _id: string
  title: string
  description: string | null
  lessons?: Lesson[]
}

interface Course {
  _id: string
  title: string
  slug: string
  description: string
  tier: string
  category: string | null
  modules?: Module[]
}

function textContains(
  text: string | null | undefined
  searchTerm: string
): boolean {
  if (!text) {
    return false
  }
  return text.toLowerCase().includes(searchTerm.toLowerCase())
}

function scoreCourse(course: Course, searchTerms: string[]): number {
  let score = 0

  for (const term of searchTerms) {
    if (textContains(course.title, term)) {
      score += 100
    }

    if (textContains(course.description, term)) {
      score += 50
    }

    if (textContains(course.category, term)) {
      score += 30
    }

    for (const module of course.modules || []) {
      if (textContains(module.title, term)) {
        score += 20
      }

      if (textContains(module.description, term)) {
        score += 10
      }

      for (const lesson of module.lessons || []) {
        if (textContains(lesson.title, term)) {
          score += 15
        }

        if (textContains(lesson.description, term)) {
          score += 8
        }

        if (textContains(lesson.contentText, term)) {
          score += 5
        }
      }
    }
  }

  return score
}

export const searchCourseTool = tool({
  description: "Search through all courses, modules, and lessons by topic, skill, or learning goal. This searches course titles,    descriptions, module content, and lesson content to find the most relevant learning material.",
  inputSchema: courseSearchSchema,
  execute: async ({ query }: z.infer<typeof courseSearchSchema>) => {
    const { data: allCourses } = await sanityFetch({
      query: ALL_COURSES_WITH_CONTENT_QUERY
    })

    const searchTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 1)

    if (searchTerms.length === 0) {
      return {
        found: false,
        message: "Please provide a search term.",
        courses: []
      }
    }

    const scoredCourses = (allCourses as Course[])
      .map(course => ({
        course,
        score: scoreCourse(course, searchTerms)
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)

    if (scoredCourses.length === 0) {
      return {
        found: false,
        message: "No courses, modules or lessons found matching your query.",
        courses: []
      }
    }

    const formattedCourses = scoredCourses.map(({ course }) => {
      const modules = course.modules || []
      const moduleDetails = modules.map(module => {
        const lessons = module.lessons || []
        return {
          title: module.title,
          description: module.description,
          lesson: lessons.map(lesson => ({
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description,
            contentPreview: lesson.contentText
              ? lesson.contentText?.slice(0, 2000) +
                (lesson.contentText.length > 2000 ? "..." : "")
              : null,
              lessonUrl: lesson.slug ? `/lessons/${lesson.slug}` : null
          }))
        }
      })

      return {
        id: course._id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        tier: course.tier,
        category: course.category,
        url: `/courses/${course.slug}`,
        moduleCount: moduleDetails.length,
        lessonCount: moduleDetails.reduce(
          (acc, m) => acc + m.lessons.length,
          0
        ),
        modules: moduleDetails
      }
    })

    return {
      found: true,
      message: `Found ${scoredCourses.length} course${scoredCourses.length === 1 ? "" : "s"} with relevant content.`,
      courses: formattedCourses
    }
  }
})