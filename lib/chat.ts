import { runQuery } from "./db-utils"

let chatTableReady = false

function ignoreDuplicateColumn(error: any) {
  if (!error || typeof error.message !== "string") {
    throw error
  }
  if (!error.message.includes("duplicate column name")) {
    throw error
  }
}

export async function ensureMessagesTable() {
  if (chatTableReady) return

  await runQuery(
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      attachment_url TEXT,
      attachment_name TEXT,
      attachment_type TEXT,
      attachment_size INTEGER,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  )

  await runQuery(
    `CREATE INDEX IF NOT EXISTS idx_messages_participants 
     ON messages(sender_id, recipient_id, created_at)`
  )

  // Добавляем недостающие колонки для уже существующих таблиц
  await runQuery("ALTER TABLE messages ADD COLUMN attachment_url TEXT").catch(ignoreDuplicateColumn)
  await runQuery("ALTER TABLE messages ADD COLUMN attachment_name TEXT").catch(ignoreDuplicateColumn)
  await runQuery("ALTER TABLE messages ADD COLUMN attachment_type TEXT").catch(ignoreDuplicateColumn)
  await runQuery("ALTER TABLE messages ADD COLUMN attachment_size INTEGER").catch(ignoreDuplicateColumn)

  await runQuery(
    `CREATE TABLE IF NOT EXISTS chat_deleted_conversations (
      user_id INTEGER NOT NULL,
      participant_id INTEGER NOT NULL,
      deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, participant_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  )

  chatTableReady = true
}

