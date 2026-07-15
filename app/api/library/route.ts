import { NextResponse } from "next/server"
import { allQuery, runQuery } from "@/lib/db-utils"

export async function GET() {
  try {
    // Проверим, есть ли материалы
    const countRows = await allQuery("SELECT COUNT(*) as cnt FROM library_materials WHERE is_available = 1")
    const count = (countRows?.[0]?.cnt as number) || 0

    if (count === 0) {
      // создадим несколько демо-материалов
      const demo = [
        ["Высшая математика. Том 1", "Пискунов Н.С.", "textbook", "Математика", 1, "PDF", 5_000_000, "/files/vysshaya-matematika-t1.pdf", 2020, 1],
        ["Физика. Механика", "Савельев И.В.", "textbook", "Физика", 1, "PDF", 4_200_000, "/files/fizika-mehanika.pdf", 2019, 1],
        ["Программирование на C++", "Страуструп Б.", "textbook", "Программирование", 2, "PDF", 6_100_000, "/files/cpp.pdf", 2021, 1],
        ["Методические указания по проектированию", "Кафедра ФЭН", "manual", "Энергетика", 3, "PDF", 2_900_000, "/files/metodichka-fen.pdf", 2023, 1],
      ]
      for (const row of demo) {
        await runQuery(
          `INSERT INTO library_materials (title, author, category, subject, course, file_format, file_size, file_url, publication_year, uploaded_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          row as any[],
        )
      }
    }

    const materials = await allQuery(
      `SELECT 
        m.id,
        m.title,
        m.author,
        m.category,
        m.subject,
        m.course,
        m.faculty,
        m.description,
        m.file_format,
        m.file_size,
        m.file_url,
        m.publication_year,
        m.publisher,
        m.pages,
        m.language,
        m.download_count,
        m.view_count,
        m.rating,
        m.is_available,
        m.created_at
      FROM library_materials m
      WHERE m.is_available = 1
      ORDER BY m.created_at DESC`
    )

    return NextResponse.json({ materials })
  } catch (error) {
    console.error("[v0] Error fetching public library materials:", error)
    return NextResponse.json({ error: "Ошибка получения материалов" }, { status: 500 })
  }
}


