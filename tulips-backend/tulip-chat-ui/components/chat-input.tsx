"use client"

import type React from "react"
import { useState } from "react"
import { ArrowUp } from "lucide-react"

export function ChatInput({
  onSend,
}: {
  onSend?: (text: string) => void
}) {
  const [value, setValue] = useState("")
  const [isListening, setIsListening] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return
    onSend?.(text)
    setValue("")
  }

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Use Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      // Auto-send directly
      onSend?.(transcript)
      setValue("")
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    ;(window as any).__tulipRecognition = recognition
    recognition.start()
    setIsListening(true)
  }

  const stopListening = () => {
    const recognition = (window as any).__tulipRecognition
    if (recognition) {
      recognition.stop()
      setIsListening(false)
    }
  }

  return (
    <div className="border-t border-border/60 px-4 pb-6 pt-3 backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-border bg-muted/40 py-1.5 pl-5 pr-1.5 ring-1 ring-inset ring-white/5 transition-colors focus-within:border-tulip-glow/40"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Talk to Tulip..."
          aria-label="Message Tulip"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
          }`}
          aria-label="Voice input"
        >
          🎤
        </button>
        <button
          type="submit"
          aria-label="Send message"
          disabled={!value.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
        >
          <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </button>
      </form>
    </div>
  )
}