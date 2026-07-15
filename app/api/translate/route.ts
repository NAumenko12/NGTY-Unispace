import { NextRequest, NextResponse } from "next/server"
import { translateText, translateObject, translateArray, supportedLanguages } from "@/lib/translation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, targetLanguage = 'en', sourceLanguage = 'auto', type = 'text' } = body

    if (!text) {
      return NextResponse.json({ error: "Текст для перевода не указан" }, { status: 400 })
    }

    if (!supportedLanguages[targetLanguage as keyof typeof supportedLanguages]) {
      return NextResponse.json({ error: "Неподдерживаемый язык" }, { status: 400 })
    }

    let result;

    switch (type) {
      case 'object':
        result = await translateObject(text, targetLanguage)
        break
      case 'array':
        result = await translateArray(text, targetLanguage)
        break
      default:
        result = await translateText(text, targetLanguage, sourceLanguage)
        break
    }

    return NextResponse.json({ 
      success: true,
      result,
      targetLanguage,
      sourceLanguage: type === 'text' ? result.detectedLanguage : sourceLanguage
    })
  } catch (error: any) {
    console.error("Translation API error:", error)
    return NextResponse.json({ 
      error: "Ошибка перевода", 
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    supportedLanguages,
    message: "API перевода доступен. Используйте POST запрос для перевода текста."
  })
}
