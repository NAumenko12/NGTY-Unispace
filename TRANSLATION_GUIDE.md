# Руководство по переводу

## Обзор

В приложение добавлен быстрый перевод через несколько бесплатных API с fallback словарем. Поддерживаются только русский и английский языки для максимальной скорости.

## Компоненты

### 1. API перевода (`/api/translate`)
- **GET**: Получить список поддерживаемых языков
- **POST**: Перевести текст
  ```json
  {
    "text": "Текст для перевода",
    "targetLanguage": "en",
    "sourceLanguage": "auto",
    "type": "text|object|array"
  }
  ```

### 2. Хуки для перевода

#### `useTranslation`
```tsx
import { useTranslation } from '@/hooks/use-translation'

function MyComponent() {
  const { translatedText, isLoading, error, translate } = useTranslation(
    "Привет мир",
    { targetLanguage: 'en', autoTranslate: true }
  )
  
  return <div>{translatedText}</div>
}
```

#### `useObjectTranslation`
```tsx
import { useObjectTranslation } from '@/hooks/use-translation'

function MyComponent() {
  const { translatedObject, isLoading, translate } = useObjectTranslation(
    { title: "Заголовок", description: "Описание" },
    'en'
  )
  
  return <div>{translatedObject.title}</div>
}
```

### 3. Компоненты

#### `LanguageSelector`
Селектор языка с поддержкой всех языков:
```tsx
import { LanguageSelector } from '@/components/language-selector'

<LanguageSelector 
  onLanguageChange={(lang) => console.log('Выбран язык:', lang)}
  className="flex"
/>
```

#### `TranslatableText`
Компонент для перевода конкретного текста:
```tsx
import { TranslatableText } from '@/components/language-selector'

<TranslatableText 
  text="Привет мир" 
  targetLanguage="en"
>
  Дополнительный контент
</TranslatableText>
```

#### `AutoTranslator`
Автоматический перевод всей страницы:
```tsx
import { AutoTranslator } from '@/components/auto-translator'

<AutoTranslator>
  <div>Ваш контент</div>
</AutoTranslator>
```

#### `NoTranslate`
Отключение перевода для конкретного элемента:
```tsx
import { NoTranslate } from '@/components/auto-translator'

<NoTranslate>
  Этот текст не будет переведен
</NoTranslate>
```

## Поддерживаемые языки

- **Русский** (ru) - основной язык
- **Английский** (en) - международный язык

## Используемые API

1. **OpenNMT** - основной API (быстрый)
2. **LibreTranslate** - альтернативный API
3. **MyMemory** - резервный API
4. **Fallback словарь** - локальный словарь для основных фраз

## Использование

### 1. Автоматический перевод
Перевод включается автоматически при смене языка в селекторе.

### 2. Ручной перевод
```tsx
import { translateText } from '@/lib/translation'

const result = await translateText("Привет", "en")
console.log(result.translatedText) // "Hello"
```

### 3. Перевод объектов
```tsx
import { translateObject } from '@/lib/translation'

const obj = { title: "Заголовок", desc: "Описание" }
const translated = await translateObject(obj, "en")
```

## Кэширование

Переводы кэшируются в памяти для повышения производительности. Повторные запросы с теми же параметрами возвращают кэшированный результат.

## Ограничения

- API MyMemory имеет лимиты на количество запросов
- Перевод может быть неточным для сложных текстов
- Некоторые языки могут иметь ограниченную поддержку

## Отладка

Для отладки перевода проверьте:
1. Консоль браузера на ошибки
2. Сетевые запросы к `/api/translate`
3. Состояние хуков перевода

## Примеры использования

### Перевод страницы
```tsx
// В layout.tsx уже подключен AutoTranslator
// Просто меняйте язык в селекторе
```

### Перевод компонента
```tsx
function MyComponent() {
  const { translatedText, isLoading } = useTranslation(
    "Добро пожаловать",
    { targetLanguage: 'en', autoTranslate: true }
  )
  
  if (isLoading) return <div>Перевод...</div>
  return <h1>{translatedText}</h1>
}
```

### Отключение перевода
```tsx
<div>
  <NoTranslate>Этот текст не переводится</NoTranslate>
  <p>Этот текст будет переведен</p>
</div>
```
