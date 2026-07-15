import { type NextRequest, NextResponse } from "next/server"
import { runQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    await runQuery("DELETE FROM library_materials WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error deleting material:", error)
    return NextResponse.json({ error: "Ошибка удаления материала" }, { status: 500 })
  }
}
