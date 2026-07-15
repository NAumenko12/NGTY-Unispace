# 🍎 Инструкция по запуску на macOS

## Требования
- macOS 10.15 (Catalina) или новее
- Xcode Command Line Tools
- Node.js 18+ 
- npm или yarn

## Пошаговая установка

### 1. Установка Xcode Command Line Tools
```bash
xcode-select --install
```

### 2. Установка Node.js
**Вариант A: Через официальный сайт**
1. Перейдите на https://nodejs.org/
2. Скачайте LTS версию для macOS
3. Установите .pkg файл

**Вариант B: Через Homebrew (рекомендуется)**
```bash
# Установка Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установка Node.js
brew install node
```

### 3. Клонирование и настройка проекта
```bash
# Перейдите в папку проекта
cd "путь/к/вашему/проекту/unispace-urfu"

# Установка зависимостей
npm install

# Если возникают проблемы с sqlite3, переустановите его
npm uninstall sqlite3
npm install sqlite3

# Или попробуйте с флагом для macOS
npm install sqlite3 --build-from-source
```

### 4. Инициализация базы данных
```bash
npm run init-db
```

### 5. Запуск приложения
```bash
npm run dev
```

## Возможные проблемы и решения

### Проблема: "sqlite3.node: invalid ELF header"
**Решение:**
```bash
# Удалите node_modules и переустановите
rm -rf node_modules package-lock.json
npm install

# Или принудительно пересоберите sqlite3
npm rebuild sqlite3
```

### Проблема: "Permission denied" при установке
**Решение:**
```bash
# Используйте sudo (не рекомендуется) или исправьте права
sudo npm install

# Или лучше - исправьте права на npm
sudo chown -R $(whoami) ~/.npm
```

### Проблема: "Command not found: node"
**Решение:**
```bash
# Добавьте Node.js в PATH
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Или для bash
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bash_profile
source ~/.bash_profile
```

### Проблема: "Python not found" при установке sqlite3
**Решение:**
```bash
# Установите Python через Homebrew
brew install python

# Или установите Xcode Command Line Tools
xcode-select --install
```

### Проблема: "gyp ERR! find Python"
**Решение:**
```bash
# Установите Python и настройте переменные
brew install python
export PYTHON=/usr/bin/python3
npm install sqlite3
```

## Альтернативные способы установки

### Использование nvm (Node Version Manager)
```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Перезапустите терминал или выполните
source ~/.zshrc

# Установка Node.js через nvm
nvm install 18
nvm use 18
nvm alias default 18
```

### Использование yarn вместо npm
```bash
# Установка yarn
npm install -g yarn

# Установка зависимостей
yarn install

# Запуск
yarn dev
```

## Проверка установки

### Проверка версий
```bash
node --version    # Должно быть v18.x.x или новее
npm --version     # Должно быть 8.x.x или новее
```

### Проверка sqlite3
```bash
node -e "console.log(require('sqlite3').VERSION)"
```

## Структура проекта после установки

```
unispace-urfu/
├── app/                 # Next.js App Router
├── components/          # React компоненты
├── lib/                # Утилиты и конфигурация
├── public/             # Статические файлы
├── data/               # База данных SQLite
├── scripts/            # Скрипты инициализации
├── package.json        # Зависимости проекта
├── next.config.js      # Конфигурация Next.js
└── tailwind.config.js  # Конфигурация Tailwind
```

## Команды для разработки

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Запуск продакшен версии
npm start

# Инициализация базы данных
npm run init-db

# Проверка типов TypeScript
npm run type-check

# Линтинг кода
npm run lint
```

## Полезные команды для отладки

```bash
# Очистка кэша npm
npm cache clean --force

# Очистка кэша Next.js
rm -rf .next

# Переустановка всех зависимостей
rm -rf node_modules package-lock.json
npm install

# Проверка портов
lsof -i :3000
```

## Настройка IDE (VS Code)

### Рекомендуемые расширения:
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- SQLite Viewer
- GitLens

### Настройки VS Code (.vscode/settings.json):
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Производственное развертывание

### Использование PM2
```bash
# Установка PM2
npm install -g pm2

# Запуск приложения
pm2 start npm --name "unispace" -- start

# Мониторинг
pm2 monit
```

### Использование Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Поддержка

Если возникают проблемы:
1. Проверьте версии Node.js и npm
2. Очистите кэш и переустановите зависимости
3. Убедитесь, что все права доступа настроены правильно
4. Проверьте логи в терминале

## Контакты

Для получения помощи обращайтесь к разработчикам проекта.
