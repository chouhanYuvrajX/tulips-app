import { cn } from "@/lib/utils"

export type ChatMessage = {
  id: string
  sender: "user" | "tulip"
  text: string
  time: string
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user"

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] text-[15px] leading-relaxed",
          isUser
            ? "rounded-3xl rounded-br-md bg-user-bubble px-4 py-2.5 text-user-bubble-foreground"
            : "rounded-3xl rounded-bl-md border border-tulip-glow/20 bg-card px-4 py-2.5 text-card-foreground shadow-[0_0_24px_-12px_var(--tulip-glow)] backdrop-blur-md",
        )}
      >
        {message.text}
      </div>
      <span
        className={cn(
          "px-2 text-[10px] text-muted-foreground/50",
          isUser ? "text-right" : "text-left",
        )}
      >
        {message.time}
      </span>
    </div>
  )
}
