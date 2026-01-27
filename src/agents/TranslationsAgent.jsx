import { Languages, Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TranslationsAgent() {
  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Languages className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Translations Agent</h1>
          <p className="text-muted-foreground">Manage app localization and translations</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Features</CardTitle>
          <CardDescription>What this agent will do</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Extract new strings from codebase</li>
            <li>• Format and send to translation provider</li>
            <li>• Integrate translated JSON back into code</li>
            <li>• Validate translations for missing keys and placeholders</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Construction className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm mt-1">Translations Agent is under development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
