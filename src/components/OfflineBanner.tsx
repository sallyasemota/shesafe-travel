import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      role="status"
      className="fixed top-0 inset-x-0 z-40 bg-orange-500 text-white text-sm text-center py-2 px-4 shadow-md"
    >
      <span aria-hidden className="mr-1">
        ⚠
      </span>
      You're offline. Live updates are paused; data may be stale.
    </div>
  )
}
