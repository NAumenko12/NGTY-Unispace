import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { allQuery, getQuery, runQuery } from "@/lib/db-utils"
import { ensureMessagesTable } from "@/lib/chat"
import { CHAT_MESSAGE_MAX_LENGTH } from "@/lib/chat-config"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    await ensureMessagesTable()

    const participantIdParam = request.nextUrl.searchParams.get("userId")
    const participantId = participantIdParam ? Number(participantIdParam) : NaN

    if (!participantIdParam || Number.isNaN(participantId)) {
      return NextResponse.json({ error: "Не указан получатель" }, { status: 400 })
    }

    if (participantId === user.id) {
      return NextResponse.json({ messages: [] })
    }

    const participant = await getQuery(
      "SELECT id, first_name, last_name FROM users WHERE id = ? AND is_banned = 0",
      [participantId]
    )

    if (!participant) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const deletion = await getQuery(
      "SELECT deleted_at FROM chat_deleted_conversations WHERE user_id = ? AND participant_id = ?",
      [user.id, participantId]
    )
    const deletedAt = deletion?.deleted_at ?? null

    const messages = await allQuery(
      `SELECT 
        m.id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.is_read,
        m.created_at,
        m.attachment_url,
        m.attachment_name,
        m.attachment_type,
        m.attachment_size,
        sender.first_name AS sender_first_name,
        sender.last_name AS sender_last_name
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      WHERE (
        (m.sender_id = ? AND m.recipient_id = ?)
        OR (m.sender_id = ? AND m.recipient_id = ?)
      )
        AND (? IS NULL OR m.created_at > ?)
      ORDER BY m.created_at ASC`,
      [user.id, participantId, participantId, user.id, deletedAt, deletedAt]
    )

    await runQuery(
      `UPDATE messages 
        SET is_read = 1 
        WHERE recipient_id = ? 
          AND sender_id = ? 
          AND is_read = 0 
          AND (? IS NULL OR created_at > ?)`,
      [user.id, participantId, deletedAt, deletedAt]
    )

    return NextResponse.json({ messages })
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    console.error("[chat] Error getting messages:", error)
    return NextResponse.json({ error: "Не удалось загрузить сообщения" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    await ensureMessagesTable()

    const body = await request.json()
    const recipientId = body?.recipientId ? Number(body.recipientId) : NaN
    const content = typeof body?.content === "string" ? body.content.trim() : ""
    const attachment = body?.attachment && typeof body.attachment === "object"
      ? {
          url: typeof body.attachment.url === "string" ? body.attachment.url : null,
          name: typeof body.attachment.name === "string" ? body.attachment.name : null,
          type: typeof body.attachment.type === "string" ? body.attachment.type : null,
          size: typeof body.attachment.size === "number" ? body.attachment.size : null,
        }
      : null

    if (!recipientId || Number.isNaN(recipientId)) {
      return NextResponse.json({ error: "Не указан получатель" }, { status: 400 })
    }

    if (recipientId === user.id) {
      return NextResponse.json({ error: "Нельзя отправить сообщение самому себе" }, { status: 400 })
    }

    if (!content && !attachment?.url) {
      return NextResponse.json({ error: "Сообщение или вложение должно быть заполнено" }, { status: 400 })
    }

    const messageText = content.slice(0, CHAT_MESSAGE_MAX_LENGTH)

    const recipient = await getQuery("SELECT id FROM users WHERE id = ? AND is_banned = 0", [recipientId])
    if (!recipient) {
      return NextResponse.json({ error: "Получатель не найден" }, { status: 404 })
    }

    const insertParams = [
      user.id,
      recipientId,
      messageText,
      attachment?.url || null,
      attachment?.name || null,
      attachment?.type || null,
      attachment?.size || null,
    ]

    const result = await runQuery(
      `INSERT INTO messages (
        sender_id,
        recipient_id,
        content,
        attachment_url,
        attachment_name,
        attachment_type,
        attachment_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      insertParams
    )

    const message = await getQuery(
      `SELECT 
        m.id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.is_read,
        m.created_at,
        m.attachment_url,
        m.attachment_name,
        m.attachment_type,
        m.attachment_size,
        sender.first_name AS sender_first_name,
        sender.last_name AS sender_last_name
      FROM messages m
      JOIN users sender ON sender.id = m.sender_id
      WHERE m.id = ?`,
      [result.lastID]
    )

    return NextResponse.json({ message }, { status: 201 })
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    console.error("[chat] Error sending message:", error)
    return NextResponse.json({ error: "Не удалось отправить сообщение" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    await ensureMessagesTable()

    let participantId: number | null = null
    const contentType = request.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => null)
      if (body?.participantId) {
        participantId = Number(body.participantId)
      }
    }

    if (!participantId) {
      const participantParam = request.nextUrl.searchParams.get("userId")
      if (participantParam) {
        participantId = Number(participantParam)
      }
    }

    if (!participantId || Number.isNaN(participantId)) {
      return NextResponse.json({ error: "Не выбран собеседник" }, { status: 400 })
    }

    if (participantId === user.id) {
      return NextResponse.json({ success: true })
    }

    const participant = await getQuery("SELECT id FROM users WHERE id = ?", [participantId])
    if (!participant) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    await runQuery(
      `INSERT INTO chat_deleted_conversations (user_id, participant_id, deleted_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, participant_id) DO UPDATE SET deleted_at = excluded.deleted_at`,
      [user.id, participantId]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    console.error("[chat] Error deleting conversation:", error)
    return NextResponse.json({ error: "Не удалось удалить чат" }, { status: 500 })
  }
}

