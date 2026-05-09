"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Paperclip, Smile } from 'lucide-react'

interface Message {
  id: number
  text: string
  sender: 'user' | 'agent'
  timestamp: Date
}

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "👋 Hello! I'm Sarah, your AI solutions specialist. How can I help you build the future today?",
      sender: 'agent',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')

  const sendMessage = () => {
    if (!input.trim()) return
    
    const newMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
    setInput('')
    
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        text: "Thanks for your message! Our team of 500+ AI engineers will get back to you instantly. Or, feel free to WhatsApp us at +254 714 694 493 for immediate assistance.",
        sender: 'agent',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, reply])
    }, 1500)
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-white rounded-full shadow-2xl hover:bg-primary/90 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-background border shadow-2xl rounded-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-primary text-white flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Intelliwave AI Support</h3>
                <p className="text-xs text-white/80">Typically replies in under 1 minute</p>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-[10px] opacity-70 block mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-2">
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Paperclip size={18} className="text-muted-foreground" />
              </button>
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                onClick={sendMessage}
                className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}