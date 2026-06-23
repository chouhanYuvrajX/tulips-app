"use client"

import { useState } from "react"
import { ChatHeader } from "@/components/chat-header"
import { ChatInput } from "@/components/chat-input"
import { MessageBubble, type ChatMessage } from "@/components/message-bubble"

function formatTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

// Voice output helper
function speakText(text: string) {
  if (!('speechSynthesis' in window)) return;
  // Stop any previous speech
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN'; // Hinglish/Hindi ke liye best
  utterance.rate = 0.9;    // Natural speed
  window.speechSynthesis.speak(utterance);
}

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId] = useState(() => crypto.randomUUID())
  const [isSending, setIsSending] = useState(false)

  async function handleSend(text: string) {
    if (isSending) return
    setIsSending(true)
    const userMessage: ChatMessage = { id: crypto.randomUUID(), sender: "user", text, time: formatTime() }
    setMessages((prev) => [...prev, userMessage])
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      })
      
      if (!res.ok) throw new Error("Network error")
      const data = await res.json()
      const aiMessage: ChatMessage = { id: crypto.randomUUID(), sender: "tulip", text: data.reply, time: formatTime() }
      setMessages((prev) => [...prev, aiMessage])
      // 🎤 Tulip bolegi!
      speakText(data.reply)
    } catch (error) {
      const errorMessage: ChatMessage = { id: crypto.randomUUID(), sender: "tulip", text: "I'm having trouble connecting right now. Please try again.", time: formatTime() }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="mx-auto flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-background">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col gap-5">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </div>
      </div>
      <ChatInput onSend={handleSend} />
    </main>
  )
}