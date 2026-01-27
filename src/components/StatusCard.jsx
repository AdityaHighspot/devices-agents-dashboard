export default function StatusCard({ status, onDismiss }) {
  const bgColor = {
    success: 'bg-green-950 border-green-800',
    error: 'bg-red-950 border-red-800',
    loading: 'bg-gray-900 border-gray-800',
  }[status.type] || 'bg-gray-900 border-gray-800'

  const textColor = {
    success: 'text-green-400',
    error: 'text-red-400',
    loading: 'text-gray-400',
  }[status.type] || 'text-gray-400'

  return (
    <div className={`${bgColor} border rounded-lg p-4 flex justify-between items-start`}>
      <div>
        <p className={`${textColor} text-sm`}>{status.message}</p>
        {status.link && (
          <a
            href={status.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-sm mt-2 inline-block"
          >
            {status.link.text} →
          </a>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-600 hover:text-gray-400 text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}
