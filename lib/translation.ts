// Утилиты для бесплатного перевода через API
export interface TranslationResult {
  translatedText: string;
  detectedLanguage: string;
}

// Кэш для переводов
const translationCache = new Map<string, string>();

// Бесплатный API для перевода (используем MyMemory API)
export async function translateText(
  text: string,
  targetLanguage: string = 'en',
  sourceLanguage: string = 'auto'
): Promise<TranslationResult> {
  // Проверяем кэш
  const cacheKey = `${text}-${sourceLanguage}-${targetLanguage}`;
  if (translationCache.has(cacheKey)) {
    return {
      translatedText: translationCache.get(cacheKey)!,
      detectedLanguage: sourceLanguage
    };
  }

  try {
    // Используем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 секунды таймаут
    
    // Пробуем несколько API по очереди
    const apis = [
      // 1. OpenNMT API (быстрый)
      `https://translate.opennmt.net/translate?src=${sourceLanguage}&tgt=${targetLanguage}&q=${encodeURIComponent(text)}`,
      // 2. LibreTranslate API (альтернативный)
      `https://libretranslate.de/translate`,
      // 3. MyMemory API (резервный)
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`
    ];
    
    let translatedText = '';
    let lastError = null;
    
    for (let i = 0; i < apis.length; i++) {
      try {
        const apiUrl = apis[i];
        let requestBody = null;
        let headers = {
          'User-Agent': 'UniSpace-App/1.0',
          'Accept': 'application/json'
        };
        
        // Настройка для разных API
        if (apiUrl.includes('libretranslate.de')) {
          requestBody = JSON.stringify({
            q: text,
            source: sourceLanguage,
            target: targetLanguage
          });
          headers['Content-Type'] = 'application/json';
        }
        
        const response = await fetch(apiUrl, {
          method: requestBody ? 'POST' : 'GET',
          body: requestBody,
          signal: controller.signal,
          headers
        });
        
        if (!response.ok) {
          throw new Error(`API ${i + 1} error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Обработка разных форматов ответов
        if (apiUrl.includes('opennmt.net')) {
          if (data && data.result && data.result[0]) {
            translatedText = data.result[0];
            break;
          }
        } else if (apiUrl.includes('libretranslate.de')) {
          if (data && data.translatedText) {
            translatedText = data.translatedText;
            break;
          }
        } else if (apiUrl.includes('mymemory')) {
          if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
            translatedText = data.responseData.translatedText;
            break;
          }
        }
        
      } catch (apiError) {
        lastError = apiError;
        console.log(`API ${i + 1} failed, trying next...`);
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    if (translatedText) {
      // Сохраняем в кэш
      translationCache.set(cacheKey, translatedText);
      
      return {
        translatedText,
        detectedLanguage: sourceLanguage
      };
    } else {
      throw lastError || new Error('All translation APIs failed');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback: используем простой словарь для основных фраз
    const fallbackTranslation = getFallbackTranslation(text, targetLanguage);
    if (fallbackTranslation !== text) {
      return {
        translatedText: fallbackTranslation,
        detectedLanguage: sourceLanguage
      };
    }
    
    // Возвращаем оригинальный текст в случае ошибки
    return {
      translatedText: text,
      detectedLanguage: sourceLanguage
    };
  }
}

// Функция для перевода объекта с текстом
export async function translateObject(
  obj: Record<string, any>,
  targetLanguage: string = 'en'
): Promise<Record<string, any>> {
  const translatedObj: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.trim()) {
      // Переводим только непустые строки
      const result = await translateText(value, targetLanguage);
      translatedObj[key] = result.translatedText;
    } else if (typeof value === 'object' && value !== null) {
      // Рекурсивно переводим вложенные объекты
      translatedObj[key] = await translateObject(value, targetLanguage);
    } else {
      translatedObj[key] = value;
    }
  }
  
  return translatedObj;
}

// Функция для перевода массива строк
export async function translateArray(
  texts: string[],
  targetLanguage: string = 'en'
): Promise<string[]> {
  const translatedTexts: string[] = [];
  
  for (const text of texts) {
    if (text.trim()) {
      const result = await translateText(text, targetLanguage);
      translatedTexts.push(result.translatedText);
    } else {
      translatedTexts.push(text);
    }
  }
  
  return translatedTexts;
}

// Поддерживаемые языки - только русский и английский
export const supportedLanguages = {
  'ru': 'Русский',
  'en': 'English'
};

// Fallback словарь для основных фраз
const fallbackDictionary: Record<string, Record<string, string>> = {
  'ru': {
    'Карта корпусов': 'Map of Buildings',
    'Бронирование': 'Booking',
    'Библиотека': 'Library',
    'Мои брони': 'My Bookings',
    'Админ панель': 'Admin Panel',
    'Войти': 'Login',
    'Регистрация': 'Register',
    'Выйти': 'Logout',
    'Профиль': 'Profile',
    'Настройки': 'Settings',
    'Поиск': 'Search',
    'Фильтр': 'Filter',
    'Сортировка': 'Sort',
    'Дата': 'Date',
    'Время': 'Time',
    'Место': 'Place',
    'Статус': 'Status',
    'Активно': 'Active',
    'Завершено': 'Completed',
    'Отменено': 'Cancelled',
    'Тихая зона': 'Quiet Zone',
    'Групповая зона': 'Group Zone',
    'Зона отдыха': 'Relax Zone',
    'Доступно': 'Available',
    'Занято': 'Occupied',
    'Забронировать': 'Book',
    'Отменить': 'Cancel',
    'Подтвердить': 'Confirm',
    'Сохранить': 'Save',
    'Удалить': 'Delete',
    'Редактировать': 'Edit',
    'Добавить': 'Add',
    'Создать': 'Create',
    'Обновить': 'Update',
    'Загрузить': 'Upload',
    'Скачать': 'Download',
    'Просмотр': 'View',
    'Детали': 'Details',
    'Информация': 'Information',
    'Помощь': 'Help',
    'Поддержка': 'Support',
    'О нас': 'About',
    'Контакты': 'Contacts',
    'Правила': 'Rules',
    'Условия': 'Terms',
    'Политика': 'Policy',
    'Безопасность': 'Security',
    'Приватность': 'Privacy'
  },
  'en': {
    'Map of Buildings': 'Карта корпусов',
    'Booking': 'Бронирование',
    'Library': 'Библиотека',
    'My Bookings': 'Мои брони',
    'Admin Panel': 'Админ панель',
    'Login': 'Войти',
    'Register': 'Регистрация',
    'Logout': 'Выйти',
    'Profile': 'Профиль',
    'Settings': 'Настройки',
    'Search': 'Поиск',
    'Filter': 'Фильтр',
    'Sort': 'Сортировка',
    'Date': 'Дата',
    'Time': 'Время',
    'Place': 'Место',
    'Status': 'Статус',
    'Active': 'Активно',
    'Completed': 'Завершено',
    'Cancelled': 'Отменено',
    'Quiet Zone': 'Тихая зона',
    'Group Zone': 'Групповая зона',
    'Relax Zone': 'Зона отдыха',
    'Available': 'Доступно',
    'Occupied': 'Занято',
    'Book': 'Забронировать',
    'Cancel': 'Отменить',
    'Confirm': 'Подтвердить',
    'Save': 'Сохранить',
    'Delete': 'Удалить',
    'Edit': 'Редактировать',
    'Add': 'Добавить',
    'Create': 'Создать',
    'Update': 'Обновить',
    'Upload': 'Загрузить',
    'Download': 'Скачать',
    'View': 'Просмотр',
    'Details': 'Детали',
    'Information': 'Информация',
    'Help': 'Помощь',
    'Support': 'Поддержка',
    'About': 'О нас',
    'Contacts': 'Контакты',
    'Rules': 'Правила',
    'Terms': 'Условия',
    'Policy': 'Политика',
    'Security': 'Безопасность',
    'Privacy': 'Приватность'
  }
};

// Функция fallback перевода
function getFallbackTranslation(text: string, targetLanguage: string): string {
  const dict = fallbackDictionary[targetLanguage];
  if (!dict) return text;
  
  // Ищем точное совпадение
  if (dict[text]) {
    return dict[text];
  }
  
  // Ищем частичное совпадение (для фраз)
  const words = text.split(' ');
  if (words.length > 1) {
    const translatedWords = words.map(word => dict[word] || word);
    return translatedWords.join(' ');
  }
  
  return text;
}

// Функция для получения языка браузера
export function getBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  const langCode = browserLang.split('-')[0];
  
  return supportedLanguages[langCode as keyof typeof supportedLanguages] ? langCode : 'en';
}

// Функция для определения языка текста
export async function detectLanguage(text: string): Promise<string> {
  try {
    const result = await translateText(text, 'en', 'auto');
    return result.detectedLanguage;
  } catch (error) {
    console.error('Language detection error:', error);
    return 'auto';
  }
}
