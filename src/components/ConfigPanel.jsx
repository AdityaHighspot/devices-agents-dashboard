import { useState, useEffect } from 'react'

const EXAMPLE = `GITHUB_TOKEN=ghp_xxxx
BUILDKITE_API_TOKEN=bkua_xxxx
CURSOR_API_KEY=key_xxxx`

export default function ConfigPanel({ config, onChange }) {
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState({})

  // Parse key=value pairs from text
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

  // Map parsed env vars to config keys
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

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Environment Variables</h2>
        <span className="text-xs text-gray-600">Paste key=value pairs (not stored)</span>
      </div>

      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={EXAMPLE}
        rows={5}
        spellCheck={false}
        className="w-full px-3 py-3 bg-gray-950 border border-gray-800 rounded-md text-sm font-mono focus:outline-none focus:border-blue-500 resize-none"
      />

      <div className="flex gap-4 mt-3 text-xs">
        <span className={hasToken('GITHUB_TOKEN') || hasToken('GH_TOKEN') ? 'text-green-500' : 'text-gray-600'}>
          {hasToken('GITHUB_TOKEN') || hasToken('GH_TOKEN') ? '✓' : '○'} GITHUB_TOKEN
        </span>
        <span className={hasToken('BUILDKITE_API_TOKEN') || hasToken('BUILDKITE_TOKEN') ? 'text-green-500' : 'text-gray-600'}>
          {hasToken('BUILDKITE_API_TOKEN') || hasToken('BUILDKITE_TOKEN') ? '✓' : '○'} BUILDKITE_API_TOKEN
        </span>
        <span className={hasToken('CURSOR_API_KEY') ? 'text-green-500' : 'text-gray-600'}>
          {hasToken('CURSOR_API_KEY') ? '✓' : '○'} CURSOR_API_KEY
        </span>
      </div>
    </div>
  )
}
