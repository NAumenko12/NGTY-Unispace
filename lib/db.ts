import sqlite3 from "sqlite3"
import path from "path"
import fs from "fs"

// Создаем директорию для БД если её нет
const dbDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, "unispace.db")
const db = new sqlite3.Database(dbPath)

// Включаем поддержку внешних ключей
db.run("PRAGMA foreign_keys = ON")

export default db
