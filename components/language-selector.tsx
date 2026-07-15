"use client"

import { useState, useEffect } from 'react'
import { supportedLanguages, getBrowserLanguage } from '@/lib/translation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Loader2 } from 'lucide-react'

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void
  className?: string
}

export function LanguageSelector({ onLanguageChange, className }: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Получаем язык из localStorage или браузера
    const savedLanguage = localStorage.getItem('selectedLanguage')
    const browserLanguage = getBrowserLanguage()
    const initialLanguage = savedLanguage || browserLanguage
    setSelectedLanguage(initialLanguage)
  }, [])

  const handleLanguageChange = async (language: string) => {
    setIsLoading(true)
    setSelectedLanguage(language)
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('selectedLanguage', language)
    
    // Уведомляем родительский компонент
    onLanguageChange?.(language)
    
    // Переводим страницу
    try {
      await translatePage(language)
    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const translatePage = async (targetLanguage: string) => {
    // Находим все текстовые элементы на странице
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label')
    
    for (const element of textElements) {
      const text = element.textContent?.trim()
      if (text && text.length > 0 && !element.hasAttribute('data-translated')) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              targetLanguage,
              type: 'text'
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success && data.result.translatedText !== text) {
              element.textContent = data.result.translatedText
              element.setAttribute('data-translated', 'true')
            }
          }
        } catch (error) {
          console.error('Element translation error:', error)
        }
      }
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4" />
      <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Выберите язык" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(supportedLanguages).map(([code, name]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                {name}
                {isLoading && selectedLanguage === code && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Компонент для перевода конкретного текста
interface TranslatableTextProps {
  text: string
  targetLanguage?: string
  className?: string
  children?: React.ReactNode
}

export function TranslatableText({ 
  text, 
  targetLanguage = 'en', 
  className,
  children 
}: TranslatableTextProps) {
  const [translatedText, setTranslatedText] = useState(text)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const translateText = async () => {
      if (targetLanguage === 'ru') {
        setTranslatedText(text)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text,
            targetLanguage,
            type: 'text'
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTranslatedText(data.result.translatedText)
          }
        }
      } catch (error) {
        console.error('Translation error:', error)
        setTranslatedText(text)
      } finally {
        setIsLoading(false)
      }
    }

    translateText()
  }, [text, targetLanguage])

  return (
    <span className={className}>
      {isLoading ? (
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {text}
        </span>
      ) : (
        translatedText
      )}
      {children}
    </span>
  )
}
