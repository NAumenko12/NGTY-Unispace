'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'ru' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  ru: {
    // Header
    'header.title': 'UniSpace НГТУ',
    'header.map': 'Карта корпусов',
    'header.booking': 'Бронирование',
    'header.library': 'Библиотека',
    'header.myBookings': 'Мои брони',
    'header.chat': 'Чат',
    'header.admin': 'Админ-панель',
    'header.login': 'Войти',
    'header.register': 'Регистрация',
    'header.profile': 'Мой профиль',
    'header.logout': 'Выйти',
    'header.adminRole': 'Администратор',
    'header.toggleTheme': 'Переключить тему',
    
    // Common
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успешно',
    'common.cancel': 'Отмена',
    'common.confirm': 'Подтвердить',
    'common.save': 'Сохранить',
    'common.edit': 'Редактировать',
    'common.delete': 'Удалить',
    'common.search': 'Поиск',
    'common.filter': 'Фильтр',
    'common.all': 'Все',
    'common.active': 'Активно',
    'common.completed': 'Завершено',
    'common.cancelled': 'Отменено',
    
    // Admin
    'admin.dashboard': 'Панель администратора',
    'admin.description': 'Управление платформой UniSpace НГТУ',
    'admin.totalUsers': 'Всего пользователей',
    'admin.activeBookings': 'Активные брони',
    'admin.totalBookings': 'Всего броней',
    'admin.totalWorkspaces': 'Рабочих мест',
    'admin.registeredStudents': 'Зарегистрированных студентов',
    'admin.currentBookings': 'Текущие бронирования',
    'admin.allTime': 'За все время',
    'admin.availableForBooking': 'Доступно для бронирования',
    'admin.userManagement': 'Управление пользователями',
    'admin.bookingManagement': 'Управление бронированиями',
    'admin.libraryManagement': 'Управление библиотекой',
    'admin.userManagementDesc': 'Просмотр, блокировка и управление учетными записями пользователей',
    'admin.bookingManagementDesc': 'Просмотр и управление всеми бронированиями по корпусам',
    'admin.libraryManagementDesc': 'Добавление, редактирование и удаление материалов',
    'admin.recentBookings': 'Последние бронирования',
    'admin.noRecentBookings': 'Нет недавних бронирований',
    
    // Users
    'users.title': 'Управление пользователями',
    'users.description': 'Просмотр и управление учетными записями',
    'users.searchPlaceholder': 'Поиск по имени, email или номеру студенческого...',
    'users.totalBookings': 'Всего броней',
    'admin.banned': 'Заблокирован',
    'admin.unban': 'Разблокировать',
    'admin.ban': 'Заблокировать',
    'admin.banUser': 'Заблокировать пользователя?',
    'admin.unbanUser': 'Разблокировать пользователя?',
    'admin.banConfirm': 'Пользователь будет заблокирован и не сможет войти в систему.',
    'admin.unbanConfirm': 'Пользователь будет разблокирован и сможет снова использовать платформу.',
    
    // Bookings
    'bookings.title': 'Управление бронированиями',
    'bookings.description': 'Просмотр всех бронирований по корпусам',
    'bookings.building': 'Корпус',
    'bookings.status': 'Статус',
    'bookings.allBuildings': 'Все корпуса',
    'bookings.allStatuses': 'Все статусы',
    'bookings.noBookings': 'Нет бронирований по выбранным фильтрам',
    'bookings.workspace': 'Место',
    'bookings.date': 'Дата',
    'bookings.time': 'Время',
    
    // Zones
    'zones.quiet': 'Тихая зона',
    'zones.group': 'Групповая зона',
    'zones.informal': 'Неформальная зона',

    // Chat
    'chat.title': 'Сообщения UniSpace',
    'chat.subtitle': 'Общение студентов и службы поддержки',
    'chat.subtitleHint': 'Напишите сокурснику или администратору',
    'chat.contactsTitle': 'Контакты',
    'chat.searchPlaceholder': 'Поиск пользователя...',
    'chat.adminShortcutTitle': 'Сообщить об ошибке?',
    'chat.adminShortcutDescription': 'Выберите администратора и опишите проблему.',
    'chat.adminShortcutAction': 'Написать администратору',
    'chat.noContacts': 'Пока нет других пользователей для общения.',
    'chat.noMessagesYet': 'Нет сообщений',
    'chat.adminBadge': 'Администратор',
    'chat.lastMessageAt': 'Последнее сообщение',
    'chat.emptyConversation': 'Начните беседу — собеседник получит уведомление при следующем входе.',
    'chat.messagePlaceholder': 'Введите сообщение... (Shift+Enter — новая строка)',
    'chat.sending': 'Отправка...',
    'chat.send': 'Отправить',
    'chat.noContactTitle': 'Выберите собеседника',
    'chat.noContactSubtitle': 'Слева список пользователей. Начните с администратора, если хотите сообщить об ошибке.',
    'chat.securityTitle': 'Напоминание о правилах',
    'chat.securityDescription': 'Не передавайте пароли и личные данные. Администраторы никогда не просят конфиденциальную информацию в чате.',
    'chat.deleteChat': 'Удалить чат',
    'chat.deleteChatConfirm': 'Очистить историю переписки? Старые сообщения останутся скрытыми, пока не появятся новые.',
    'chat.deleteChatSuccess': 'Чат очищен',
    'chat.deleteChatError': 'Не удалось очистить чат',
    'chat.attachmentAdd': 'Прикрепить файл',
    'chat.attachmentRemove': 'Убрать вложение',
    'chat.attachmentPreview': '📎 Вложение',
    'chat.attachmentDownload': 'Скачать вложение',
    'chat.attachmentImageAlt': 'Вложенное изображение',
    'chat.uploadSuccess': 'Файл загружен',
    'chat.uploadError': 'Не удалось загрузить файл',
    'chat.fileTooLarge': 'Файл больше 10 МБ',
    'chat.emptyMessageError': 'Введите сообщение или прикрепите файл',
  },
  en: {
    // Header
    'header.title': 'UniSpace NSTU',
    'header.map': 'Campus Map',
    'header.booking': 'Booking',
    'header.library': 'Library',
    'header.myBookings': 'My Bookings',
    'header.chat': 'Chat',
    'header.admin': 'Admin Panel',
    'header.login': 'Login',
    'header.register': 'Register',
    'header.profile': 'My Profile',
    'header.logout': 'Logout',
    'header.adminRole': 'Administrator',
    'header.toggleTheme': 'Toggle theme',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.active': 'Active',
    'common.completed': 'Completed',
    'common.cancelled': 'Cancelled',
    
    // Admin
    'admin.dashboard': 'Admin Dashboard',
    'admin.description': 'UniSpace NSTU Platform Management',
    'admin.totalUsers': 'Total Users',
    'admin.activeBookings': 'Active Bookings',
    'admin.totalBookings': 'Total Bookings',
    'admin.totalWorkspaces': 'Workspaces',
    'admin.registeredStudents': 'Registered Students',
    'admin.currentBookings': 'Current Bookings',
    'admin.allTime': 'All Time',
    'admin.availableForBooking': 'Available for Booking',
    'admin.userManagement': 'User Management',
    'admin.bookingManagement': 'Booking Management',
    'admin.libraryManagement': 'Library Management',
    'admin.userManagementDesc': 'View, block and manage user accounts',
    'admin.bookingManagementDesc': 'View and manage all bookings by buildings',
    'admin.libraryManagementDesc': 'Add, edit and delete materials',
    'admin.recentBookings': 'Recent Bookings',
    'admin.noRecentBookings': 'No recent bookings',
    
    // Users
    'users.title': 'User Management',
    'users.description': 'View and manage user accounts',
    'users.searchPlaceholder': 'Search by name, email or student ID...',
    'users.totalBookings': 'Total Bookings',
    'admin.banned': 'Banned',
    'admin.unban': 'Unban',
    'admin.ban': 'Ban',
    'admin.banUser': 'Ban user?',
    'admin.unbanUser': 'Unban user?',
    'admin.banConfirm': 'User will be banned and unable to log in.',
    'admin.unbanConfirm': 'User will be unbanned and can use the platform again.',
    
    // Bookings
    'bookings.title': 'Booking Management',
    'bookings.description': 'View all bookings by buildings',
    'bookings.building': 'Building',
    'bookings.status': 'Status',
    'bookings.allBuildings': 'All Buildings',
    'bookings.allStatuses': 'All Statuses',
    'bookings.noBookings': 'No bookings match the selected filters',
    'bookings.workspace': 'Workspace',
    'bookings.date': 'Date',
    'bookings.time': 'Time',
    
    // Zones
    'zones.quiet': 'Quiet Zone',
    'zones.group': 'Group Zone',
    'zones.informal': 'Informal Zone',

    // Chat
    'chat.title': 'UniSpace Messages',
    'chat.subtitle': 'Talk to classmates or the support team',
    'chat.subtitleHint': 'Reach out to classmates or report an issue',
    'chat.contactsTitle': 'Contacts',
    'chat.searchPlaceholder': 'Search for a user...',
    'chat.adminShortcutTitle': 'Need to report a problem?',
    'chat.adminShortcutDescription': 'Select an administrator and describe the issue.',
    'chat.adminShortcutAction': 'Message administrator',
    'chat.noContacts': 'No other users are available yet.',
    'chat.noMessagesYet': 'No messages yet',
    'chat.adminBadge': 'Administrator',
    'chat.lastMessageAt': 'Last message',
    'chat.emptyConversation': 'Say hello — the recipient will see your message on the next visit.',
    'chat.messagePlaceholder': 'Type a message... (Shift+Enter for a new line)',
    'chat.sending': 'Sending...',
    'chat.send': 'Send',
    'chat.noContactTitle': 'Select a conversation',
    'chat.noContactSubtitle': 'Pick someone from the list on the left. Start with an admin if you need help.',
    'chat.securityTitle': 'Security reminder',
    'chat.securityDescription': 'Never share passwords or sensitive data. Admins will never ask for confidential information in chat.',
    'chat.deleteChat': 'Clear chat',
    'chat.deleteChatConfirm': 'Delete the conversation history? Older messages stay hidden until new ones arrive.',
    'chat.deleteChatSuccess': 'Chat history cleared',
    'chat.deleteChatError': 'Failed to clear chat',
    'chat.attachmentAdd': 'Attach file',
    'chat.attachmentRemove': 'Remove attachment',
    'chat.attachmentPreview': '📎 Attachment',
    'chat.attachmentDownload': 'Download attachment',
    'chat.attachmentImageAlt': 'Attached image',
    'chat.uploadSuccess': 'File uploaded',
    'chat.uploadError': 'Failed to upload file',
    'chat.fileTooLarge': 'File exceeds 10 MB',
    'chat.emptyMessageError': 'Type a message or attach a file',
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Получаем сохраненный язык из localStorage
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'ru' || savedLanguage === 'en')) {
      setLanguage(savedLanguage)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('language', language)
      // Обновляем атрибут lang в HTML
      document.documentElement.lang = language
      // Принудительно обновляем все компоненты
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }))
    }
  }, [language, mounted])

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
  }

  // Предотвращаем гидратацию до монтирования
  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  
  // Если контекст не найден, возвращаем значения по умолчанию
  if (context === undefined) {
    console.warn('useLanguage used outside of LanguageProvider, using default values')
    return {
      language: 'ru' as Language,
      setLanguage: () => {
        console.warn('setLanguage called outside of LanguageProvider')
      },
      t: (key: string) => {
        // Возвращаем ключ как есть, если переводы недоступны
        return key
      }
    }
  }
  
  return context
}
