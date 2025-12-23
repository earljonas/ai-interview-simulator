import { Code2, MessageSquare, Target } from "lucide-react"
import FeatureCard from "./FeatureCard"

export default function Features() {
  return (
    <div className="container mx-auto px-4 pb-20">
      <div className="grid max-w-4xl mx-auto gap-6 sm:grid-cols-3 mt-8">
        <FeatureCard
          icon={MessageSquare}
          title="Real Questions"
          description="Practice with questions used in actual technical interviews at top companies."
        />
        <FeatureCard
          icon={Target}
          title="AI Feedback"
          description="Receive detailed analysis of your answers with specific improvement suggestions."
        />
        <FeatureCard
          icon={Code2}
          title="Role-Specific"
          description="Tailored interview paths for Frontend, Backend, Data Science, and AI roles."
        />
      </div>
    </div>
  )
}
