import { FlaskConical, Bot } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const agents = [
  { id: 'unity', name: 'Unity Agent', icon: FlaskConical, desc: 'Unit Tests' },
  { id: 'sentry', name: 'Sentry Agent', image: 'sentry-icon.png', desc: 'E2E Tests' },
]

export function AppSidebar({ activeAgent, onAgentChange }) {
  return (
    <Sidebar>
      <SidebarHeader className="h-14 border-b border-sidebar-border px-4 !flex-row items-center gap-2">
        <Bot className="h-5 w-5" />
        <span className="text-sm font-semibold">Devices Agents</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.map((agent) => (
                <SidebarMenuItem key={agent.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="h-16 py-3"
                    isActive={activeAgent === agent.id}
                    onClick={() => onAgentChange(agent.id)}
                    tooltip={agent.name}
                  >
                    {agent.icon ? (
                      <agent.icon className="h-6 w-6" />
                    ) : (
                      <img
                        src={`${import.meta.env.BASE_URL}${agent.image}`}
                        alt={agent.name}
                        className="h-6 w-6 rounded object-cover object-center"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="text-base font-medium">{agent.name}</span>
                      <span className="text-sm text-muted-foreground">{agent.desc}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <a
          href="https://github.com/AdityaHighspot/devices-agents-dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View on GitHub →
        </a>
      </SidebarFooter>
    </Sidebar>
  )
}
