import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import { runQuery } from "@/lib/db-utils"
import { requireAuth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const form = await request.formData()
    const file = form.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 })
    }

    // Проверка размера (до 5 МБ)
    const maxSize = 5 * 1024 * 1024
    if ((file as any).size && (file as any).size > maxSize) {
      return NextResponse.json({ error: "Файл слишком большой (до 5 МБ)" }, { status: 400 })
    }

    // Проверка контент-тайпа
    const allowed = ["image/png", "image/jpeg", "image/webp"]
    const mime = (file as any).type || ""
    if (!allowed.includes(mime)) {
      return NextResponse.json({ error: "Допустимы PNG, JPEG, WEBP" }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    // Проверка магических байтов (простая)
    const arrayBuffer = await file.arrayBuffer()
    const buf = Buffer.from(arrayBuffer)
    const isPng = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    const isJpeg = buf.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    const isWebp = buf.slice(8, 12).toString("ascii") === "WEBP"
    if (!(isPng || isJpeg || isWebp)) {
      return NextResponse.json({ error: "Файл не является валидным изображением" }, { status: 400 })
    }

    // Случайное имя файла
    const fileExt = mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg"
    const fileName = `avatar_${user.id}_${crypto.randomBytes(8).toString("hex")}${fileExt}`
    const filePath = path.join(uploadsDir, fileName)

    fs.writeFileSync(filePath, buf)

    const publicUrl = `/uploads/${fileName}`
    await runQuery("UPDATE users SET avatar_url = ? WHERE id = ?", [publicUrl, user.id])

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }
    console.error("[v0] Upload avatar error:", error)
    return NextResponse.json({ error: "Ошибка загрузки аватара" }, { status: 500 })
  }
}


