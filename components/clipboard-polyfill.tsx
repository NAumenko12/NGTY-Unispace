"use client"

import { useEffect } from "react"

export default function ClipboardPolyfill() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const nav: any = window.navigator as any

    const fallbackCopy = (text: string) => {
      try {
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.left = "-9999px"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(textarea)
        return ok ? Promise.resolve() : Promise.reject(new Error("Copy failed"))
      } catch (e) {
        return Promise.reject(e)
      }
    }

    if (!nav.clipboard) {
      nav.clipboard = { writeText: fallbackCopy }
    } else {
      const originalWriteText = nav.clipboard.writeText?.bind(nav.clipboard)
      if (originalWriteText) {
        nav.clipboard.writeText = (text: string) => {
          return originalWriteText(text).catch(() => fallbackCopy(text))
        }
      }
    }
  }, [])

  return null
}


