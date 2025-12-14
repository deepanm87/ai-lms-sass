"use client"

import { Suspense } from "react"
import { useDocumentProjection, type DocumentHandle } from "@sanity/sdk-react"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen } from "lucide-react"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { ModuleItem } from "./ModuleItem"
import type { CourseModulesData } from "./types"