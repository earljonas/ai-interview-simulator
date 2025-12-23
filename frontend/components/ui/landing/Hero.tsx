import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Hero() {
  return (
    <main className="container mx-auto px-4">
      <section className="flex flex-col items-center justify-center pt-24 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Interview with AI
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Simulate real technical interviews for developers. Get structured
          feedback and improve your skills before the real thing.
        </p>

        <div className="mt-10">
          <Button asChild size="lg">
            <Link href="/select-role">
              Start Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
