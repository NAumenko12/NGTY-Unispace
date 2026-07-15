"use client"

import { useState, useEffect, useCallback } from 'react'

interface TranslationState {
  isLoading: boolean
  error: string | null
  translatedText: string
  detectedLanguage: string
}

interface UseTranslationOptions {
  targetLanguage?: string
  sourceLanguage?: string
  autoTranslate?: boolean
}

export function useTranslation(
  text: string,
  options: UseTranslationOptions = {}
) {
  const {
    targetLanguage = 'en',
    sourceLanguage = 'auto',
    autoTranslate = false
  } = options

  const [state, setState] = useState<TranslationState>({
    isLoading: false,
    error: null,
    translatedText: text,
    detectedLanguage: sourceLanguage
  })

  const translate = useCallback(async () => {
    if (!text.trim()) {
      setState(prev => ({ ...prev, translatedText: text }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          targetLanguage,
          sourceLanguage,
          type: 'text'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Translation failed')
      }

      setState({
        isLoading: false,
        error: null,
        translatedText: data.result.translatedText,
        detectedLanguage: data.sourceLanguage
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        translatedText: text // Fallback to original text
      }))
    }
  }, [text, targetLanguage, sourceLanguage])

  // Автоматический перевод при изменении текста
  useEffect(() => {
    if (autoTranslate && text.trim()) {
      translate()
    }
  }, [text, autoTranslate, translate])

  return {
    ...state,
    translate,
    isTranslated: state.translatedText !== text
  }
}

// Хук для перевода объекта
export function useObjectTranslation<T extends Record<string, any>>(
  obj: T,
  targetLanguage: string = 'en'
) {
  const [state, setState] = useState<{
    isLoading: boolean
    error: string | null
    translatedObject: T
  }>({
    isLoading: false,
    error: null,
    translatedObject: obj
  })

  const translate = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: obj,
          targetLanguage,
          type: 'object'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Translation failed')
      }

      setState({
        isLoading: false,
        error: null,
        translatedObject: data.result
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        translatedObject: obj // Fallback to original object
      }))
    }
  }, [obj, targetLanguage])

  return {
    ...state,
    translate
  }
}

// Хук для перевода массива
export function useArrayTranslation(
  texts: string[],
  targetLanguage: string = 'en'
) {
  const [state, setState] = useState<{
    isLoading: boolean
    error: string | null
    translatedTexts: string[]
  }>({
    isLoading: false,
    error: null,
    translatedTexts: texts
  })

  const translate = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: texts,
          targetLanguage,
          type: 'array'
        })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Translation failed')
      }

      setState({
        isLoading: false,
        error: null,
        translatedTexts: data.result
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
        translatedTexts: texts // Fallback to original texts
      }))
    }
  }, [texts, targetLanguage])

  return {
    ...state,
    translate
  }
}
