import { Code2 } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b border-border/50">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Code2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">InterviewAI</span>
        </div>
      </div>
    </header>
  )
}
