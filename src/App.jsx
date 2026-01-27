import { useState, useEffect } from 'react'
import ConfigPanel from './components/ConfigPanel'
import BranchSelector from './components/BranchSelector'
import FileTree from './components/FileTree'
import StatusCard from './components/StatusCard'

const GITHUB_OWNER = 'highspot'
const GITHUB_REPO = 'app_voyager'
const BUILDKITE_ORG = 'highspot'
const BUILDKITE_PIPELINE = 'voyager-unity-agent'

export default function App() {
  const [config, setConfig] = useState({
    githubToken: '',
    buildkiteToken: '',
    cursorApiKey: '',
  })
  const [branch, setBranch] = useState('main')
  const [branches, setBranches] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState({ branches: false, files: false, pipeline: false })

  // Load branch from localStorage (tokens are pasted fresh each session)
  useEffect(() => {
    const savedBranch = localStorage.getItem('unity_branch')
    if (savedBranch) setBranch(savedBranch)
  }, [])


  const fetchBranches = async () => {
    if (!config.githubToken) {
      setStatus({ type: 'error', message: 'GitHub token required' })
      return
    }
    setLoading(l => ({ ...l, branches: true }))
    try {
      // Fetch all branches (paginated)
      let allBranches = []
      let page = 1
      let hasMore = true

      while (hasMore && page <= 5) { // Max 500 branches
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/branches?per_page=100&page=${page}`,
          { headers: { Authorization: `token ${config.githubToken}` } }
        )
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

        const data = await response.json()
        allBranches = allBranches.concat(data.map(b => b.name))
        hasMore = data.length === 100
        page++
      }

      // Sort alphabetically, but put main/develop/master first
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
      setStatus({ type: 'success', message: `Loaded ${allBranches.length} branches` })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(l => ({ ...l, branches: false }))
    }
  }

  const fetchFiles = async () => {
    if (!config.githubToken) {
      setStatus({ type: 'error', message: 'GitHub token required' })
      return
    }
    setLoading(l => ({ ...l, files: true }))
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${branch}?recursive=1`,
        { headers: { Authorization: `token ${config.githubToken}` } }
      )
      if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)

      const data = await response.json()
      const dartFiles = data.tree
        .filter(f => f.type === 'blob' && f.path.startsWith('lib/') && f.path.endsWith('.dart'))
        .filter(f => !f.path.endsWith('.g.dart') && !f.path.endsWith('.freezed.dart'))
        .map(f => f.path)
        .sort()

      setFiles(dartFiles)
      setSelectedFiles(new Set())
      setStatus({ type: 'success', message: `Found ${dartFiles.length} files` })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(l => ({ ...l, files: false }))
    }
  }

  const runPipeline = async () => {
    if (!config.buildkiteToken) {
      setStatus({ type: 'error', message: 'BuildKite token required' })
      return
    }
    if (!config.cursorApiKey) {
      setStatus({ type: 'error', message: 'Cursor API Key required' })
      return
    }
    if (selectedFiles.size === 0) {
      setStatus({ type: 'error', message: 'Select at least one file' })
      return
    }

    setLoading(l => ({ ...l, pipeline: true }))
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
      setStatus({
        type: 'success',
        message: 'Pipeline triggered!',
        link: { url: build.web_url, text: `View Build #${build.number}` },
      })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(l => ({ ...l, pipeline: false }))
    }
  }

  const handleBranchChange = (newBranch) => {
    setBranch(newBranch)
    localStorage.setItem('unity_branch', newBranch)
    setFiles([])
    setSelectedFiles(new Set())
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-400 mb-2">🤖 Unity Agent</h1>
        <p className="text-gray-500 mb-6">Select files to generate unit tests</p>

        <ConfigPanel config={config} onChange={setConfig} />

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Branch & Files</h2>

          <BranchSelector
            branch={branch}
            branches={branches}
            loading={loading.branches}
            onBranchChange={handleBranchChange}
            onFetchBranches={fetchBranches}
          />

          <div className="flex gap-2 mt-4 mb-4">
            <button
              onClick={fetchFiles}
              disabled={loading.files}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-sm disabled:opacity-50"
            >
              {loading.files ? 'Loading...' : 'Fetch Files'}
            </button>
          </div>

          {files.length > 0 && (
            <FileTree
              files={files}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
          )}

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={runPipeline}
              disabled={loading.pipeline || selectedFiles.size === 0}
              className="px-5 py-2 bg-green-700 hover:bg-green-600 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading.pipeline ? 'Triggering...' : 'Run Unity Agent'}
            </button>
            <span className="text-gray-500 text-sm">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>

        {status && <StatusCard status={status} onDismiss={() => setStatus(null)} />}
      </div>
    </div>
  )
}
