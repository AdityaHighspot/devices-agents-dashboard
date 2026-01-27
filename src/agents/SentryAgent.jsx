import { Shield, Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ConfigPanel from '@/components/ConfigPanel'

export default function SentryAgent({ config, onConfigChange }) {
  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Sentry Agent</h1>
          <p className="text-muted-foreground">Generate E2E Patrol tests from Zephyr specs</p>
        </div>
      </div>

      <ConfigPanel config={config} onChange={onConfigChange} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Configuration</CardTitle>
          <CardDescription>Set up Sentry Agent parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Construction className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm mt-1">Sentry Agent integration is under development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
