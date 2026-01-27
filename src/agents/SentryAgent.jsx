import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ConfigPanel from '@/components/ConfigPanel'
import ZephyrTestTree from '@/components/ZephyrTestTree'

const BUILDKITE_ORG = 'highspot'
const BUILDKITE_PIPELINE = 'voyager-sentry-agent'

const SENTRY_TOKENS = [
  { key: 'GITHUB_TOKEN', label: 'GitHub', aliases: ['GH_TOKEN'] },
  { key: 'BUILDKITE_API_TOKEN', label: 'BuildKite', aliases: ['BUILDKITE_TOKEN'] },
  { key: 'CURSOR_API_KEY', label: 'Cursor', aliases: [] },
  { key: 'ZEPHYR_TOKEN', label: 'Zephyr', aliases: [] },
]

export default function SentryAgent({ config, onConfigChange }) {
  const [mode, setMode] = useState('migrate')
  const [loading, setLoading] = useState(false)
  const [selectedTests, setSelectedTests] = useState(new Set())

  // Fix mode fields
  const [agentId, setAgentId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [previousLogs, setPreviousLogs] = useState('')

  const canRun = () => {
    if (!config.buildkiteApiToken || !config.cursorApiKey) return false
    if (mode === 'fix') {
      return agentId && branchName
    }
    // migrate/new need selected tests
    return selectedTests.size > 0
  }

  const runPipeline = async () => {
    if (!canRun()) return

    setLoading(true)
    try {
      const env = {
        MODE: mode,
        CURSOR_API_KEY: config.cursorApiKey,
        GITHUB_TOKEN: config.githubToken,
      }

      if (mode === 'fix') {
        env.AGENT_ID = agentId
        env.BRANCH_NAME = branchName
        env.USER_INSTRUCTION = instruction
        env.PREVIOUS_LOGS = previousLogs
      } else {
        // Pass selected test keys
        env.TEST_KEYS = Array.from(selectedTests).join(',')
        env.ZEPHYR_TOKEN = config.zephyrToken || ''
      }

      const response = await fetch(
        `https://api.buildkite.com/v2/organizations/${BUILDKITE_ORG}/pipelines/${BUILDKITE_PIPELINE}/builds`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.buildkiteApiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commit: 'HEAD',
            branch: mode === 'fix' ? branchName : 'feat/sentry-agent',
            message: mode === 'fix'
              ? `Sentry fix: ${instruction.slice(0, 50)}`
              : `Sentry ${mode}: ${selectedTests.size} test(s)`,
            env,
          }),
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || `BuildKite API error: ${response.status}`)
      }

      const build = await response.json()
      toast.success('Pipeline triggered!', {
        description: `Build #${build.number}`,
        action: {
          label: 'View',
          onClick: () => window.open(build.web_url, '_blank'),
        },
      })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}sentry-icon.png`}
          alt="Sentry"
          className="h-10 w-10 rounded object-cover object-center"
        />
        <div>
          <h1 className="text-2xl font-bold">Sentry Agent</h1>
          <p className="text-muted-foreground">Generate E2E Patrol tests from Zephyr specs</p>
        </div>
      </div>

      <ConfigPanel config={config} onChange={onConfigChange} tokens={SENTRY_TOKENS} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Mode</CardTitle>
          <CardDescription>Choose how to run the agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'migrate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('migrate')}
            >
              Migrate
            </Button>
            <Button
              variant={mode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('new')}
            >
              New
            </Button>
            <Button
              variant={mode === 'fix' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('fix')}
            >
              Fix
            </Button>
          </div>
        </CardContent>
      </Card>

      {mode !== 'fix' ? (
        <ZephyrTestTree
          selectedTests={selectedTests}
          onSelectionChange={setSelectedTests}
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fix Settings</CardTitle>
            <CardDescription>Fix a failing test from previous run</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Agent ID</label>
                <Input
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="agent_xxx"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Branch Name</label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="sentry/HS-T12345-xxx"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Instruction</label>
              <Textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="What should the agent fix?"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Previous Logs (optional)</label>
              <Textarea
                value={previousLogs}
                onChange={(e) => setPreviousLogs(e.target.value)}
                placeholder="Paste test failure logs here..."
                rows={5}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <Button onClick={runPipeline} disabled={loading || !canRun()}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Triggering...' : 'Run Sentry Agent'}
        </Button>
        {mode !== 'fix' && (
          <span className="text-sm text-muted-foreground">
            {selectedTests.size} test{selectedTests.size !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
    </div>
  )
}
