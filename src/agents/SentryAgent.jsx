import { useState } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ConfigPanel from '@/components/ConfigPanel'

const BUILDKITE_ORG = 'highspot'
const BUILDKITE_PIPELINE = 'voyager-sentry-agent'

const SENTRY_TOKENS = [
  { key: 'GITHUB_TOKEN', label: 'GitHub', aliases: ['GH_TOKEN'] },
  { key: 'BUILDKITE_API_TOKEN', label: 'BuildKite', aliases: ['BUILDKITE_TOKEN'] },
  { key: 'CURSOR_API_KEY', label: 'Cursor', aliases: [] },
  { key: 'ZEPHYR_TOKEN', label: 'Zephyr', aliases: [] },
  { key: 'BROWSERSTACK_USERNAME', label: 'BrowserStack Username', aliases: [] },
  { key: 'BROWSERSTACK_ACCESS_KEY', label: 'BrowserStack Access Key', aliases: [] },
]

export default function SentryAgent({ config, onConfigChange }) {
  const [mode, setMode] = useState('migrate')
  const [loading, setLoading] = useState(false)

  // Migrate mode fields
  const [folderId, setFolderId] = useState('')
  const [filterType, setFilterType] = useState('automated-appium')
  const [testCount, setTestCount] = useState('1')

  // Fix mode fields
  const [agentId, setAgentId] = useState('')
  const [branchName, setBranchName] = useState('')
  const [instruction, setInstruction] = useState('')
  const [previousLogs, setPreviousLogs] = useState('')

  const runPipeline = async () => {
    if (!config.buildkiteApiToken) {
      toast.error('BuildKite token required')
      return
    }
    if (!config.cursorApiKey) {
      toast.error('Cursor API Key required')
      return
    }

    if (mode === 'fix') {
      if (!agentId || !branchName) {
        toast.error('Agent ID and Branch Name required for fix mode')
        return
      }
    }

    setLoading(true)
    try {
      const env = {
        MODE: mode,
        CURSOR_API_KEY: config.cursorApiKey,
        GITHUB_TOKEN: config.githubToken,
        ZEPHYR_TOKEN: config.zephyrToken || '',
        BROWSERSTACK_USERNAME: config.browserstackUsername || '',
        BROWSERSTACK_ACCESS_KEY: config.browserstackAccessKey || '',
      }

      if (mode === 'migrate') {
        env.FILTER_TYPE = filterType
        env.TEST_COUNT = testCount
        if (folderId) env.FOLDER_ID = folderId
      } else {
        env.AGENT_ID = agentId
        env.BRANCH_NAME = branchName
        env.USER_INSTRUCTION = instruction
        env.PREVIOUS_LOGS = previousLogs
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
            message: mode === 'fix' ? `Sentry fix: ${instruction.slice(0, 50)}` : `Sentry migrate: ${testCount} test(s)`,
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
        <Shield className="h-8 w-8 text-primary" />
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
          <div className="flex gap-2">
            <Button
              variant={mode === 'migrate' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('migrate')}
            >
              Migrate
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

      {mode === 'migrate' ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Migrate Settings</CardTitle>
            <CardDescription>Fetch tests from Zephyr and generate Patrol tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder ID (optional)</label>
                <Input
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  placeholder="e.g. 12345"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Type</label>
                <Input
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  placeholder="automated-appium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Test Count</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={testCount}
                  onChange={(e) => setTestCount(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Button onClick={runPipeline} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Triggering...' : `Run Sentry Agent (${mode})`}
        </Button>
      </div>
    </div>
  )
}
