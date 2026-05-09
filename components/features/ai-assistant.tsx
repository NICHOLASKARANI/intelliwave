'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m IntelliWave AI Assistant. I can help you with:\n\n• Finding the right service\n• Estimating project costs\n• Technical consultations\n• Booking meetings with our team\n\nHow can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary hover:bg-primary-600 text-white rounded-full shadow-2xl glow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bot className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] glassmorphism rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-accent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">IntelliWave AI</h3>
                    <p className="text-xs text-white/70">Always here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-secondary/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex gap-2 p-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce delay-200" />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button onClick={handleSend} size="icon" className="bg-primary hover:bg-primary-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function getAIResponse(input: string): string {
  const lower = input.toLowerCase()
  
  if (lower.includes('website') || lower.includes('web')) {
    return "For custom websites, we offer:\n\n• Premium Business Websites: KSh 150,000 - 300,000\n• Advanced E-commerce: KSh 100,000 - 500,000\n• Custom Web Applications: KSh 300,000 - 3,000,000\n\nWould you like me to connect you with a specialist?"
  }
  
  if (lower.includes('ai') || lower.includes('agent')) {
    return "Our AI solutions include:\n\n• Custom AI Agents\n• AI Chatbot Integration\n• AI Project Estimation\n• Machine Learning Models\n\nOur 500+ AI engineers are ready to build your solution. Want to schedule a consultation?"
  }
  
  if (lower.includes('price') || lower.includes('cost')) {
    return "Our pricing is competitive and transparent:\n\n🏢 Business Websites from KSh 150,000\n🛒 E-commerce from KSh 100,000\n⚡ Web Apps from KSh 300,000\n\nVisit our Pricing page for detailed breakdowns or I can have our team prepare a custom quote."
  }
  
  return "Great question! I'd love to help. You can:\n\n1️⃣ Browse our Services page\n2️⃣ Check Pricing for estimates\n3️⃣ I can connect you with our team\n4️⃣ Book a free consultation\n\nWhat would you prefer?"
}