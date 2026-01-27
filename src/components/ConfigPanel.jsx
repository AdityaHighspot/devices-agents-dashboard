import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Circle } from 'lucide-react'

const DEFAULT_TOKENS = [
  { key: 'GITHUB_TOKEN', label: 'GitHub', aliases: ['GH_TOKEN'] },
  { key: 'BUILDKITE_API_TOKEN', label: 'BuildKite', aliases: ['BUILDKITE_TOKEN'] },
  { key: 'CURSOR_API_KEY', label: 'Cursor', aliases: [] },
]

export default function ConfigPanel({ config, onChange, tokens = DEFAULT_TOKENS, placeholder }) {
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
    const result = {}
    tokens.forEach((t) => {
      const value = envVars[t.key] || t.aliases?.find((a) => envVars[a]) && envVars[t.aliases.find((a) => envVars[a])] || ''
      // Use camelCase version of key for config
      const configKey = t.key.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      result[configKey] = value
    })
    return result
  }

  const handleChange = (text) => {
    setRaw(text)
    const envVars = parseEnvVars(text)
    setParsed(envVars)
    onChange(mapToConfig(envVars))
  }

  const hasToken = (token) => {
    if (parsed[token.key]) return true
    return token.aliases?.some((a) => parsed[a]) || false
  }

  const TokenStatus = ({ token }) => {
    const found = hasToken(token)
    return (
      <div className={`flex items-center gap-1 text-xs ${found ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
        {found ? <CheckCircle className="h-3 w-3 shrink-0" /> : <Circle className="h-3 w-3 shrink-0" />}
        <span className="truncate">{token.label}</span>
      </div>
    )
  }

  const defaultPlaceholder = tokens.map((t) => `${t.key}=xxx`).join('\n')

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Environment Variables</CardTitle>
        <CardDescription>Paste key=value pairs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || defaultPlaceholder}
          rows={Math.max(5, tokens.length + 1)}
          spellCheck={false}
          className="font-mono text-sm resize-none"
        />
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {tokens.map((t) => (
            <TokenStatus key={t.key} token={t} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
