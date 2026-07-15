import { NextResponse } from "next/server"
import { getQuery, runQuery } from "@/lib/db-utils"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const material = await getQuery("SELECT id, file_url FROM library_materials WHERE id = ?", [id]) as
      | { id: number; file_url: string }
      | undefined

    if (!material) {
      return NextResponse.json({ error: "Материал не найден" }, { status: 404 })
    }

    await runQuery(
      "UPDATE library_materials SET download_count = COALESCE(download_count,0) + 1 WHERE id = ?",
      [id]
    )

    const url = material.file_url.startsWith("http")
      ? material.file_url
      : new URL(material.file_url, `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`).toString()
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("[v0] Error on material download:", error)
    return NextResponse.json({ error: "Ошибка скачивания материала" }, { status: 500 })
  }
}


