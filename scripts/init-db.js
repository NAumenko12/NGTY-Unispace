const sqlite3 = require("sqlite3")
const bcrypt = require("bcryptjs")
const path = require("path")
const fs = require("fs")

// Создаем директорию для БД если её нет
const dbDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new sqlite3.Database(path.join(dbDir, "unispace.db"))

console.log("Инициализация базы данных...")

// Функция для выполнения SQL с промисом
function runSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve({ changes: this.changes, lastID: this.lastID })
      }
    })
  })
}

// Функция для выполнения exec с промисом
function execSQL(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

async function initDatabase() {
  try {
    // Создание таблиц
    await execSQL(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        student_id TEXT UNIQUE,
        phone TEXT,
        faculty TEXT,
        course INTEGER,
        avatar_url TEXT,
        role TEXT DEFAULT 'student',
        is_banned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS buildings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        full_name TEXT,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        total_capacity INTEGER NOT NULL,
        description TEXT,
        facilities TEXT,
        working_hours_start TEXT DEFAULT '08:00',
        working_hours_end TEXT DEFAULT '22:00',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building_id INTEGER NOT NULL,
        workspace_number TEXT NOT NULL,
        zone_type TEXT NOT NULL,
        floor INTEGER,
        has_monitor BOOLEAN DEFAULT 0,
        has_power_outlet BOOLEAN DEFAULT 1,
        has_ethernet BOOLEAN DEFAULT 0,
        equipment TEXT,
        is_available BOOLEAN DEFAULT 1,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id),
        UNIQUE(building_id, workspace_number)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        workspace_id INTEGER NOT NULL,
        building_id INTEGER NOT NULL,
        booking_date DATE NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        zone_type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        check_in_time DATETIME,
        check_out_time DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        cancelled_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
        FOREIGN KEY (building_id) REFERENCES buildings(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_bookings ON bookings(user_id, booking_date);
      CREATE INDEX IF NOT EXISTS idx_workspace_bookings ON bookings(workspace_id, booking_date);

      CREATE TABLE IF NOT EXISTS messages (
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
      );

      CREATE INDEX IF NOT EXISTS idx_messages_participants 
        ON messages(sender_id, recipient_id, created_at);

      CREATE TABLE IF NOT EXISTS chat_deleted_conversations (
        user_id INTEGER NOT NULL,
        participant_id INTEGER NOT NULL,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, participant_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS library_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        subject TEXT NOT NULL,
        course INTEGER,
        faculty TEXT,
        description TEXT,
        file_format TEXT,
        file_size INTEGER,
        file_url TEXT NOT NULL,
        preview_url TEXT,
        cover_image_url TEXT,
        isbn TEXT,
        publication_year INTEGER,
        publisher TEXT,
        pages INTEGER,
        language TEXT DEFAULT 'ru',
        download_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        rating REAL DEFAULT 0,
        is_available BOOLEAN DEFAULT 1,
        uploaded_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_category ON library_materials(category);
      CREATE INDEX IF NOT EXISTS idx_subject ON library_materials(subject);
    `)

    console.log("Таблицы созданы успешно")

    // Создание админа
    const adminPassword = bcrypt.hashSync("admin123", 10)
    await runSQL(`
      INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, student_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ["admin@ngtu.ru", adminPassword, "Администратор", "Системы", "admin", "ADMIN001"])
    console.log("Админ создан: admin@ngtu.ru / admin123")

    // Создание тестовых студентов
    const studentPassword = bcrypt.hashSync("student123", 10)
    const demoStudents = [
      { email: "student@ngtu.ru", firstName: "Иван", lastName: "Иванов", studentId: "STU001", faculty: "ФЭН", course: 2 },
      { email: "anna.kuznetsova@ngtu.ru", firstName: "Анна", lastName: "Кузнецова", studentId: "STU002", faculty: "ФЭП", course: 1 },
      { email: "nikita.volkov@ngtu.ru", firstName: "Никита", lastName: "Волков", studentId: "STU003", faculty: "ФЛА", course: 3 },
      { email: "ksenia.mironova@ngtu.ru", firstName: "Ксения", lastName: "Миронова", studentId: "STU004", faculty: "ФМФ", course: 4 },
      { email: "pavel.egorov@ngtu.ru", firstName: "Павел", lastName: "Егоров", studentId: "STU005", faculty: "ИТФ", course: 5 },
    ]

    for (const student of demoStudents) {
      await runSQL(`
        INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, student_id, faculty, course)
        VALUES (?, ?, ?, ?, 'student', ?, ?, ?)
      `, [student.email, studentPassword, student.firstName, student.lastName, student.studentId, student.faculty, student.course])
    }
    console.log(`Создано ${demoStudents.length} тестовых студентов (пароль: student123)`)

    // Заполнение корпусов НГТУ
    const buildings = [
      {
        name: "Корпус 1",
        full_name: "Главный корпус НГТУ",
        address: "пр. Карла Маркса, 20",
        latitude: 54.987746,
        longitude: 82.906335,
        capacity: 150,
        description: "Главный учебный корпус университета",
      },
      {
        name: "Корпус 2",
        full_name: "Факультет энергетики",
        address: "пр. Карла Маркса, 20, корп. 2",
        latitude: 54.986573,
        longitude: 82.905491,
        capacity: 120,
        description: "Корпус факультета энергетики",
      },
      {
        name: "Корпус 3а-3б",
        full_name: "Факультет летательных аппаратов НГТУ",
        address: "Геодезическая ул., 10",
        latitude: 54.986656,
        longitude: 82.908536,
        capacity: 100,
        description: "Корпус факультета летательных аппаратов",
      },
      {
        name: "Корпус 4",
        full_name: "Факультет радиотехники и электроники",
        address: "пр. Карла Маркса, 20к4",
        latitude: 54.985467,
        longitude: 82.907099,
        capacity: 130,
        description: "Корпус факультета радиотехники и электроники",
      },
      {
        name: "Корпус 6",
        full_name: "Корпус 6 НГТУ",
        address: "пр. Карла Маркса, 20к6",
        latitude: 54.986402,
        longitude: 82.903766,
        capacity: 90,
        description: "Учебный корпус №6",
      },
      {
        name: "Корпус 7",
        full_name: "Корпус 7 (Горский)",
        address: "ул. Немировича-Данченко, 136",
        latitude: 54.987162,
        longitude: 82.915031,
        capacity: 80,
        description: "Отдельно стоящий корпус на ул. Немировича-Данченко",
      },
      {
        name: "Корпус 8",
        full_name: "Институт социальных технологий и реабилитации",
        address: "пр. Карла Маркса, 20к8",
        latitude: 54.986315,
        longitude: 82.907099,
        capacity: 70,
        description: "Корпус института социальных технологий",
      },
    ]

    for (const building of buildings) {
      const facilities = JSON.stringify(["Wi-Fi", "Розетки", "Кондиционер", "Отопление"])
      await runSQL(`
        INSERT OR IGNORE INTO buildings (name, full_name, address, latitude, longitude, total_capacity, description, facilities)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        building.name,
        building.full_name,
        building.address,
        building.latitude,
        building.longitude,
        building.capacity,
        building.description,
        facilities,
      ])
    }

    console.log(`Добавлено ${buildings.length} корпусов`)

    // Создание рабочих мест для каждого корпуса
    const zoneTypes = ["quiet", "group", "informal"]
    let totalWorkspaces = 0

    for (let buildingId = 1; buildingId <= buildings.length; buildingId++) {
      const capacity = buildings[buildingId - 1].capacity
      const workspacesPerFloor = Math.ceil(capacity / 3)

      for (let floor = 1; floor <= 3; floor++) {
        for (let i = 1; i <= workspacesPerFloor; i++) {
          const zoneType = zoneTypes[(i - 1) % 3]
          const workspaceNumber = `${String.fromCharCode(64 + floor)}-${String(i).padStart(3, "0")}`
          const hasMonitor = Math.random() > 0.7

          await runSQL(`
            INSERT OR IGNORE INTO workspaces (building_id, workspace_number, zone_type, floor, has_monitor, has_power_outlet)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [buildingId, workspaceNumber, zoneType, floor, hasMonitor ? 1 : 0, 1])
          totalWorkspaces++
        }
      }
    }

    console.log(`Создано ${totalWorkspaces} рабочих мест`)

    // Добавление материалов в библиотеку
    const materials = [
      {
        title: "Высшая математика. Том 1",
        author: "Пискунов Н.С.",
        category: "textbook",
        subject: "Математика",
        course: 1,
        year: 2020,
      },
      {
        title: "Физика. Механика",
        author: "Савельев И.В.",
        category: "textbook",
        subject: "Физика",
        course: 1,
        year: 2019,
      },
      {
        title: "Программирование на C++",
        author: "Страуструп Б.",
        category: "textbook",
        subject: "Программирование",
        course: 2,
        year: 2021,
      },
      {
        title: "Методические указания по курсовому проектированию",
        author: "Кафедра ФЭН",
        category: "manual",
        subject: "Энергетика",
        course: 3,
        year: 2023,
      },
    ]

    for (const material of materials) {
      await runSQL(`
        INSERT INTO library_materials (title, author, category, subject, course, file_format, file_size, file_url, publication_year, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        material.title,
        material.author,
        material.category,
        material.subject,
        material.course,
        "PDF",
        Math.floor(Math.random() * 10000000) + 1000000,
        `/files/${material.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        material.year,
        1,
      ])
    }

    console.log(`Добавлено ${materials.length} материалов в библиотеку`)

    db.close()
    console.log("База данных успешно инициализирована!")
  } catch (error) {
    console.error("Ошибка инициализации базы данных:", error)
    db.close()
    process.exit(1)
  }
}

initDatabase()