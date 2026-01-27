import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react'

export default function StatusCard({ status, onDismiss }) {
  const variants = {
    success: {
      variant: 'default',
      icon: CheckCircle,
      className: 'border-green-500/50 text-green-500 [&>svg]:text-green-500',
    },
    error: {
      variant: 'destructive',
      icon: XCircle,
      className: '',
    },
    loading: {
      variant: 'default',
      icon: Loader2,
      className: '[&>svg]:animate-spin',
    },
  }

  const config = variants[status.type] || variants.loading
  const Icon = config.icon

  return (
    <Alert variant={config.variant} className={`relative ${config.className}`}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{status.type === 'success' ? 'Success' : status.type === 'error' ? 'Error' : 'Loading'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 absolute top-2 right-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        {status.message}
        {status.link && (
          <a
            href={status.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-primary hover:underline"
          >
            {status.link.text} →
          </a>
        )}
      </AlertDescription>
    </Alert>
  )
}
