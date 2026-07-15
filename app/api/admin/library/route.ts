import { type NextRequest, NextResponse } from "next/server"
import { allQuery, runQuery, getQuery } from "@/lib/db-utils"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()

    const materials = await allQuery(
      `
      SELECT 
        m.*,
        u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM library_materials m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC
    `
    )

    return NextResponse.json({ materials })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error fetching materials:", error)
    return NextResponse.json({ error: "Ошибка получения материалов" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const {
      title,
      author,
      category,
      subject,
      course,
      faculty,
      description,
      fileFormat,
      fileSize,
      fileUrl,
      publicationYear,
      publisher,
      pages,
    } = body

    if (!title || !author || !category || !subject || !fileFormat || !fileUrl) {
      return NextResponse.json({ error: "Не указаны обязательные поля" }, { status: 400 })
    }

    const result = await runQuery(
      `
      INSERT INTO library_materials (
        title, author, category, subject, course, faculty, description,
        file_format, file_size, file_url, publication_year, publisher, pages, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        title,
        author,
        category,
        subject,
        course || null,
        faculty || null,
        description || null,
        fileFormat,
        fileSize || null,
        fileUrl,
        publicationYear || null,
        publisher || null,
        pages || null,
        user.id,
      ]
    )

    const material = await getQuery("SELECT * FROM library_materials WHERE id = ?", [result.lastID])

    return NextResponse.json({ material })
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 })
    }
    console.error("[v0] Error creating material:", error)
    return NextResponse.json({ error: "Ошибка создания материала" }, { status: 500 })
  }
}
