import db from "./db"

// Утилиты для работы с асинхронным sqlite3
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error("SQL Error in runQuery:", err)
        reject(err)
      } else {
        resolve({ changes: this.changes, lastID: this.lastID })
      }
    })
  })
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error("SQL Error in getQuery:", err)
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("SQL Error in allQuery:", err)
        reject(err)
      } else {
        resolve(rows || [])
      }
    })
  })
}
