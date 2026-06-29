import Image from "next/image"
import { Settings } from "lucide-react"

export function ChatHeader() {
  return (
    <header className="relative flex items-center justify-center border-b border-border/60 px-5 py-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9">
          {/* soft glow halo */}
          <div
            className="absolute -inset-1 rounded-full bg-tulip-glow/40 blur-md"
            aria-hidden="true"
          />
          <Image
            src="/tulip-avatar.png"
            alt="Tulip avatar"
            width={36}
            height={36}
            className="relative h-9 w-9 rounded-full object-cover ring-1 ring-border/80"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-medium tracking-tight text-foreground">
            Tulip
          </span>
          <span className="text-[11px] font-normal text-muted-foreground">
            Your companion
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label="Settings"
        className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
      >
        <Settings className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
    </header>
  )
}
