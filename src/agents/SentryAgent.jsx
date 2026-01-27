import { useState } from 'react'
import ConfigPanel from '@/components/ConfigPanel'
import StatusCard from '@/components/StatusCard'

export default function SentryAgent({ config, onConfigChange }) {
  const [status, setStatus] = useState(null)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span>🛡️</span> Sentry Agent
        </h1>
        <p className="text-gray-500 mt-1">Generate E2E Patrol tests from Zephyr specs</p>
      </div>

      <ConfigPanel config={config} onChange={onConfigChange} />

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">Configuration</h2>

        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🚧</div>
          <p className="text-lg">Coming Soon</p>
          <p className="text-sm mt-2">Sentry Agent integration is under development</p>
        </div>
      </div>

      {status && <StatusCard status={status} onDismiss={() => setStatus(null)} />}
    </div>
  )
}
