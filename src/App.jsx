import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Moon, Sun } from 'lucide-react'
import UnityAgent from '@/agents/UnityAgent'
import SentryAgent from '@/agents/SentryAgent'

export default function App() {
  const [activeAgent, setActiveAgent] = useState('unity')
  const [config, setConfig] = useState({
    githubToken: '',
    buildkiteToken: '',
    cursorApiKey: '',
  })
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return true
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  return (
    <>
    <Toaster position="top-right" richColors />
    <SidebarProvider>
      <AppSidebar activeAgent={activeAgent} onAgentChange={setActiveAgent} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        <div className="flex-1 overflow-auto">
          {activeAgent === 'unity' && (
            <UnityAgent config={config} onConfigChange={setConfig} />
          )}
          {activeAgent === 'sentry' && (
            <SentryAgent config={config} onConfigChange={setConfig} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
