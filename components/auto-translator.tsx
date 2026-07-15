"use client"

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'

interface AutoTranslatorProps {
  children: React.ReactNode
}

export function AutoTranslator({ children }: AutoTranslatorProps) {
  const { language } = useLanguage()
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedElements, setTranslatedElements] = useState<Set<Element>>(new Set())

  useEffect(() => {
    if (language === 'ru') {
      // Если русский язык, не переводим
      return
    }

    const translatePage = async () => {
      setIsTranslating(true)
      
      try {
        // Находим все текстовые элементы, которые еще не переведены
        const textElements = document.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, span, div, button, a, label, li, td, th, caption, figcaption, blockquote, cite, em, strong, small, mark, del, ins, sub, sup, code, pre, kbd, samp, var, dfn, abbr, time, address, details, summary'
        )

        const elementsToTranslate = Array.from(textElements).filter(
          element => !translatedElements.has(element) && 
          !element.hasAttribute('data-translated') &&
          !element.hasAttribute('data-no-translate') &&
          element.textContent?.trim() &&
          element.textContent.trim().length > 0
        )

        // Переводим элементы батчами по 5 штук
        const batchSize = 5
        for (let i = 0; i < elementsToTranslate.length; i += batchSize) {
          const batch = elementsToTranslate.slice(i, i + batchSize)
          
          await Promise.all(
            batch.map(async (element) => {
              const text = element.textContent?.trim()
              if (!text) return

              try {
                const response = await fetch('/api/translate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    text,
                    targetLanguage: language,
                    type: 'text'
                  })
                })

                if (response.ok) {
                  const data = await response.json()
                  if (data.success && data.result.translatedText !== text) {
                    element.textContent = data.result.translatedText
                    element.setAttribute('data-translated', 'true')
                    setTranslatedElements(prev => new Set([...prev, element]))
                  }
                }
              } catch (error) {
                console.error('Element translation error:', error)
              }
            })
          )

          // Небольшая задержка между батчами
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (error) {
        console.error('Page translation error:', error)
      } finally {
        setIsTranslating(false)
      }
    }

    // Запускаем перевод с небольшой задержкой
    const timeoutId = setTimeout(translatePage, 500)
    
    return () => clearTimeout(timeoutId)
  }, [language, translatedElements])

  return (
    <>
      {children}
      {isTranslating && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Перевод...</span>
        </div>
      )}
    </>
  )
}

// Компонент для отключения перевода конкретного элемента
interface NoTranslateProps {
  children: React.ReactNode
  className?: string
}

export function NoTranslate({ children, className }: NoTranslateProps) {
  return (
    <span className={className} data-no-translate>
      {children}
    </span>
  )
}
