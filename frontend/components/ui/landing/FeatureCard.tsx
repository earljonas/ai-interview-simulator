import { Card, CardContent } from "@/components/ui/card"

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="text-center">
      <CardContent className="p-6">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
