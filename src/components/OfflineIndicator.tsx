/**
 * Offline Indicator Component
 * Shows when the app is running offline to demonstrate zero-cloud capability
 */

import { useState, useEffect } from 'react'
import { WifiOff, Wifi, Shield } from 'lucide-react'
import clsx from 'clsx'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showBanner, setShowBanner] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Keep banner visible briefly to show transition
      setTimeout(() => setShowBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showBanner && isOnline) return null

  return (
    <div
      className={clsx(
        'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300',
        isOnline
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
      )}
    >
      <div className={clsx(
        'flex items-center justify-center w-10 h-10 rounded-full',
        isOnline ? 'bg-green-100' : 'bg-indigo-100'
      )}>
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium text-sm">
            {isOnline ? 'Back Online' : 'Offline Mode Active'}
          </span>
        </div>
        <p className="text-xs mt-0.5 opacity-80">
          {isOnline
            ? 'Your data stayed private the whole time'
            : 'All features work - your data never leaves this device'}
        </p>
      </div>

      {isOnline && (
        <button
          onClick={() => setShowBanner(false)}
          className="ml-2 text-green-600 hover:text-green-800"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
