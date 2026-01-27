import { useState, useEffect } from 'react'
import { FlaskConical, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ConfigPanel from '@/components/ConfigPanel'

const UNITY_TOKENS = [
  { key: 'GITHUB_TOKEN', label: 'GitHub', aliases: ['GH_TOKEN'] },
  { key: 'BUILDKITE_API_TOKEN', label: 'BuildKite', aliases: ['BUILDKITE_TOKEN'] },
  { key: 'CURSOR_API_KEY', label: 'Cursor', aliases: [] },
]
import BranchSelector from '@/components/BranchSelector'
import FileTree from '@/components/FileTree'

const GITHUB_OWNER = 'highspot'
const GITHUB_REPO = 'app_voyager'
const BUILDKITE_ORG = 'highspot'
const BUILDKITE_PIPELINE = 'voyager-unity-agent'

export default function UnityAgent({ config, onConfigChange }) {
  const [branch, setBranch] = useState('main')
  const [branches, setBranches] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [loading, setLoading] = useState({ branches: false, files: false, pipeline: false })

  useEffect(() => {
    const savedBranch = localStorage.getItem('unity_branch')
    if (savedBranch) setBranch(savedBranch)
  }, [])

  // Auto-fetch files when branch changes and we have a token
  useEffect(() => {
    if (config.githubToken && branch) {
      fetchFiles()
    }
  }, [branch, config.githubToken])

  const fetchBranches = async () => {
    if (!config.githubToken) {
      toast.error('GitHub token required')
      return
    }
    setLoading((l) => ({ ...l, branches: true }))
    try {
      let allBranches = []
      let page = 1
      let hasMore = true

      while (hasMore && page <= 5) {
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches?per_page=100&page=${page}`,
          { headers: { Authorization: `token ${config.githubToken}` } }
        )
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

        const data = await response.json()
        allBranches = allBranches.concat(data.map((b) => b.name))
        hasMore = data.length === 100
        page++
      }

      const priority = ['main', 'master', 'develop']
      allBranches.sort((a, b) => {
        const aP = priority.indexOf(a)
        const bP = priority.indexOf(b)
        if (aP !== -1 && bP !== -1) return aP - bP
        if (aP !== -1) return -1
        if (bP !== -1) return 1
        return a.localeCompare(b)
      })

      setBranches(allBranches)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading((l) => ({ ...l, branches: false }))
    }
  }

  const fetchFiles = async () => {
    if (!config.githubToken) return
    
    setLoading((l) => ({ ...l, files: true }))
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `token ${config.githubToken}` } }
      )
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

      const data = await response.json()
      const dartFiles = data.tree
        .filter((f) => f.type === 'blob' && f.path.startsWith('lib/') && f.path.endsWith('.dart'))
        .filter((f) => !f.path.endsWith('.g.dart') && !f.path.endsWith('.freezed.dart'))
        .map((f) => f.path)
        .sort()

      setFiles(dartFiles)
      setSelectedFiles(new Set())
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading((l) => ({ ...l, files: false }))
    }
  }

  const runPipeline = async () => {
    if (!config.buildkiteToken) {
      toast.error('BuildKite token required')
      return
    }
    if (!config.cursorApiKey) {
      toast.error('Cursor API Key required')
      return
    }
    if (selectedFiles.size === 0) {
      toast.error('Select at least one file')
      return
    }

    setLoading((l) => ({ ...l, pipeline: true }))
    try {
      const response = await fetch(
        `https://api.buildkite.com/v2/organizations/${BUILDKITE_ORG}/pipelines/${BUILDKITE_PIPELINE}/builds`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.buildkiteToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commit: 'HEAD',
            branch: branch,
            message: `Unity Agent UI - ${selectedFiles.size} files`,
            env: {
              TARGET_FILES: Array.from(selectedFiles).join(','),
              BASE_BRANCH: branch,
              COVERAGE_THRESHOLD: '90',
              CURSOR_API_KEY: config.cursorApiKey,
              GITHUB_TOKEN: config.githubToken,
            },
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
      setLoading((l) => ({ ...l, pipeline: false }))
    }
  }

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch)
    localStorage.setItem('unity_branch', newBranch)
    setFiles([])
    setSelectedFiles(new Set())
  }

  return (
    <div className="p-6 max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Unity Agent</h1>
          <p className="text-muted-foreground">Generate unit tests for Dart files</p>
        </div>
      </div>

      <ConfigPanel config={config} onChange={onConfigChange} tokens={UNITY_TOKENS} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Branch & Files</CardTitle>
          <CardDescription>Select a branch to generate tests for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BranchSelector
            branch={branch}
            branches={branches}
            loading={loading.branches}
            onBranchChange={handleBranchChange}
            onFetchBranches={fetchBranches}
          />

          {loading.files ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading files...</span>
            </div>
          ) : files.length > 0 ? (
            <FileTree
              files={files}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
          ) : config.githubToken ? (
            <p className="text-sm text-muted-foreground py-4">
              Select a branch to load files
            </p>
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Add GitHub token to load files
            </p>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button
              onClick={runPipeline}
              disabled={loading.pipeline || selectedFiles.size === 0}
            >
              {loading.pipeline && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading.pipeline ? 'Triggering...' : 'Run Unity Agent'}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
