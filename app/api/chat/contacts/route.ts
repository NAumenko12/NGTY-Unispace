import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { allQuery } from "@/lib/db-utils"
import { ensureMessagesTable } from "@/lib/chat"

export async function GET() {
  try {
    const user = await requireAuth()
    await ensureMessagesTable()

    const contacts = await allQuery(
      `
      SELECT
        u.id,
        u.first_name AS first_name,
        u.last_name AS last_name,
        u.role,
        u.avatar_url,
        (
          SELECT m.content
          FROM messages m
          WHERE (
            (m.sender_id = u.id AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = u.id)
          )
            AND (cdc.deleted_at IS NULL OR m.created_at > cdc.deleted_at)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT m.created_at
          FROM messages m
          WHERE (
            (m.sender_id = u.id AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = u.id)
          )
            AND (cdc.deleted_at IS NULL OR m.created_at > cdc.deleted_at)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_message_at,
        (
          SELECT m.attachment_name
          FROM messages m
          WHERE (
            (m.sender_id = u.id AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = u.id)
          )
            AND (cdc.deleted_at IS NULL OR m.created_at > cdc.deleted_at)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_attachment_name,
        (
          SELECT m.attachment_type
          FROM messages m
          WHERE (
            (m.sender_id = u.id AND m.recipient_id = ?)
            OR (m.sender_id = ? AND m.recipient_id = u.id)
          )
            AND (cdc.deleted_at IS NULL OR m.created_at > cdc.deleted_at)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS last_attachment_type,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.sender_id = u.id 
            AND m.recipient_id = ? 
            AND m.is_read = 0
            AND (cdc.deleted_at IS NULL OR m.created_at > cdc.deleted_at)
        ) AS unread_count
      FROM users u
      LEFT JOIN chat_deleted_conversations cdc
        ON cdc.user_id = ? AND cdc.participant_id = u.id
      WHERE u.id != ? AND u.is_banned = 0
      ORDER BY
        CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END,
        last_message_at DESC,
        u.role = 'admin' DESC,
        u.first_name ASC,
        u.last_name ASC
      `,
      [
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
        user.id,
      ]
    )

    return NextResponse.json({ contacts })
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    console.error("[chat] Error fetching contacts:", error)
    return NextResponse.json({ error: "Не удалось загрузить контакты" }, { status: 500 })
  }
}

