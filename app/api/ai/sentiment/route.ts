import { NextRequest, NextResponse } from 'next/server'

function analyzeSentiment(text: string): {
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  keywords: string[]
  summary: string
} {
  const positiveWords = ['great', 'excellent', 'amazing', 'outstanding', 'best', 'transformed', 'impressive', 'professional', 'efficient', 'recommend']
  const negativeWords = ['poor', 'bad', 'terrible', 'disappointed', 'slow', 'expensive', 'issue', 'problem', 'fail']
  
  const words = text.toLowerCase().split(/\s+/)
  let positiveCount = 0
  let negativeCount = 0
  const keywords: string[] = []

  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveCount++
      keywords.push(word)
    }
    if (negativeWords.includes(word)) {
      negativeCount++
      keywords.push(word)
    }
  })

  const total = positiveCount + negativeCount
  const score = total > 0 ? (positiveCount / total) * 100 : 50

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (score > 60) sentiment = 'positive'
  else if (score < 40) sentiment = 'negative'

  return {
    sentiment,
    score: Math.round(score),
    keywords: [...new Set(keywords)],
    summary: sentiment === 'positive' 
      ? 'This testimonial reflects high client satisfaction'
      : sentiment === 'negative'
      ? 'This testimonial indicates areas for improvement'
      : 'This testimonial is neutral in tone',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required for sentiment analysis' },
        { status: 400 }
      )
    }

    const result = analyzeSentiment(text)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}