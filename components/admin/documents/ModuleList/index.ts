"use client"

import { Suspense, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  useApplyDocumentActions,
  createDocument,
  createDocumentHandle
} from "@sanity/sdk-react"
import { ListPageHeader, SearchInput } from "@/components/admin/shared"
import { ModuleListSkeleton } from "@/components/admin/shared"
import { ModuleListContent } from "./ModuleListContent"
import type { ModuleListProps } from "./types"