import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Circle } from 'lucide-react'

const EXAMPLE = `GITHUB_TOKEN=ghp_xxxx
BUILDKITE_API_TOKEN=bkua_xxxx
CURSOR_API_KEY=key_xxxx`

export default function ConfigPanel({ config, onChange }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState({})

  const parseEnvVars = (text) => {
    const result = {}
    const lines = text.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eqIndex = trimmed.indexOf('=')
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim()
        const value = trimmed.substring(eqIndex + 1).trim()
        result[key] = value
      }
    }
    return result
  }

  const mapToConfig = (envVars) => {
    return {
      githubToken: envVars.GITHUB_TOKEN || envVars.GH_TOKEN || '',
      buildkiteToken: envVars.BUILDKITE_API_TOKEN || envVars.BUILDKITE_TOKEN || '',
      cursorApiKey: envVars.CURSOR_API_KEY || '',
    }
  }

  const handleChange = (text) => {
    setRaw(text)
    const envVars = parseEnvVars(text)
    setParsed(envVars)
    onChange(mapToConfig(envVars))
  }

  const hasToken = (name) => {
    return parsed[name] && parsed[name].length > 0
  }

  const TokenStatus = ({ name, label }) => {
    const found = hasToken(name)
    return (
      <div className={`flex items-center gap-1.5 text-xs ${found ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        {found ? <CheckCircle className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Environment Variables</CardTitle>
        <CardDescription>Paste key=value pairs (not stored)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={EXAMPLE}
          rows={5}
          spellCheck={false}
          className="font-mono text-sm resize-none"
        />
        <div className="flex gap-4">
          <TokenStatus name="GITHUB_TOKEN" label="GITHUB_TOKEN" />
          <TokenStatus name="BUILDKITE_API_TOKEN" label="BUILDKITE_API_TOKEN" />
          <TokenStatus name="CURSOR_API_KEY" label="CURSOR_API_KEY" />
        </div>
      </CardContent>
    </Card>
  )
}
