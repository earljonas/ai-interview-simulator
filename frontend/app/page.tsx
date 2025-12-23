import Header from "@/components/ui/landing/Header"
import Hero from "@/components/ui/landing/Hero"
import Features from "@/components/ui/landing/Features"
import Footer from "@/components/ui/landing/Footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </div>
  )
}
