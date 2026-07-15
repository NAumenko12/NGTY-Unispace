import { NextResponse } from "next/server"
import { getQuery, runQuery } from "@/lib/db-utils"

export async function GET(
  _request: Request,
  ctx: { params: any },
) {
  try {
    const resolved = ctx.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params
    const { id } = resolved || {}
    const material = (await getQuery("SELECT id, file_url FROM library_materials WHERE id = ?", [Number(id)])) as
      | { id: number; file_url: string | null }
      | undefined

    if (!material) {
      return NextResponse.json({ error: "Материал не найден" }, { status: 404 })
    }

    await runQuery("UPDATE library_materials SET view_count = COALESCE(view_count,0) + 1 WHERE id = ?", [Number(id)])

    const fileUrl = material.file_url || ""
    if (!fileUrl) {
      return NextResponse.json({ error: "Файл отсутствует" }, { status: 404 })
    }
    const url = fileUrl.startsWith("http")
      ? fileUrl
      : new URL(fileUrl, `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`).toString()
    return NextResponse.redirect(url)
  } catch (error) {
    console.error("[v0] Error on material view:", error)
    return NextResponse.json({ error: "Ошибка открытия материала" }, { status: 500 })
  }
}


