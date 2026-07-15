import fs from "fs"
import path from "path"
import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "chat")

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "Размер файла превышает 10 МБ" }, { status: 400 })
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true })

    const fileExt = path.extname(file.name) || ""
    const safeExt = fileExt.slice(0, 10) // ограничим длину
    const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.promises.writeFile(filePath, buffer)

    return NextResponse.json({
      url: `/uploads/chat/${fileName}`,
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    })
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[chat] Upload error:", error)
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 })
  }
}

