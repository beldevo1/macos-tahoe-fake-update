import { useState, useEffect, useCallback } from 'react'

const AppleLogo = ({ className }: { className?: string }) => (
  <svg 
    fill="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
  </svg>
)

function App() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [duration, setDuration] = useState(60) // seconds
  const [progress, setProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [statusMessage, setStatusMessage] = useState('Installing macOS Tahoe...')

  const statusMessages = [
    'Installing macOS Tahoe...',
    'Preparing system files...',
    'Optimizing system performance...',
    'Configuring system preferences...',
    'Installing security updates...',
    'Updating system components...',
    'Verifying installation...',
    'Almost done...',
    'Finalizing installation...',
  ]

  const formatTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `About ${Math.ceil(seconds)} seconds remaining`
    } else if (seconds < 3600) {
      const mins = Math.ceil(seconds / 60)
      return `About ${mins} minute${mins > 1 ? 's' : ''} remaining`
    } else {
      const hours = Math.floor(seconds / 3600)
      const mins = Math.ceil((seconds % 3600) / 60)
      return `About ${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''} remaining`
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(() => {})
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(() => {})
    }
  }, [])

  const startUpdate = useCallback(() => {
    setIsUpdating(true)
    setProgress(0)
  }, [])

  const stopUpdate = useCallback(() => {
    setIsUpdating(false)
    setProgress(0)
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    setIsFullscreen(false)
  }, [])

  useEffect(() => {
    if (!isUpdating) return

    const totalMs = duration * 1000
    const interval = 100 // update every 100ms
    const increment = 100 / (totalMs / interval)
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment
        if (newProgress >= 100) {
          clearInterval(timer)
          return 100
        }
        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isUpdating, duration])

  useEffect(() => {
    if (!isUpdating) return
    
    const remaining = ((100 - progress) / 100) * duration
    setTimeRemaining(formatTime(remaining))

    // Change status message based on progress
    const messageIndex = Math.min(
      Math.floor(progress / (100 / statusMessages.length)),
      statusMessages.length - 1
    )
    setStatusMessage(statusMessages[messageIndex])
  }, [progress, duration, isUpdating, formatTime])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Handle escape key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isUpdating) {
        stopUpdate()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isUpdating, stopUpdate])

  if (isUpdating) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white select-none cursor-default">
        {/* Apple Logo */}
        <AppleLogo className="w-20 h-20 text-white mb-8" />
        
        {/* Progress Bar */}
        <div className="w-80 h-1.5 bg-gray-700 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Status Message */}
        <p className="text-gray-400 text-sm mb-1">{statusMessage}</p>
        
        {/* Time Remaining */}
        <p className="text-gray-500 text-xs">{timeRemaining}</p>
        
        {/* Hidden exit hint */}
        <p className="fixed bottom-4 text-gray-700 text-xs">Press ESC to exit</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <AppleLogo className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">macOS Tahoe Update</h1>
          <p className="text-gray-400 text-sm">Fake Update Screen Simulator</p>
          <p className="text-gray-500 text-xs mt-2">🎃 A harmless prank for your friends!</p>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Duration Setting */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Update Duration
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="3600"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-white text-sm w-20 text-right">
                {duration < 60 
                  ? `${duration}s` 
                  : duration < 3600 
                    ? `${Math.floor(duration / 60)}m ${duration % 60}s`
                    : `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`
                }
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setDuration(30)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                30s
              </button>
              <button
                onClick={() => setDuration(60)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                1m
              </button>
              <button
                onClick={() => setDuration(300)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                5m
              </button>
              <button
                onClick={() => setDuration(600)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                10m
              </button>
              <button
                onClick={() => setDuration(1800)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                30m
              </button>
              <button
                onClick={() => setDuration(3600)}
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700"
              >
                1h
              </button>
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-300 text-sm font-medium">Fullscreen Mode</label>
              <p className="text-gray-500 text-xs">For a more realistic experience</p>
            </div>
            <button
              onClick={toggleFullscreen}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isFullscreen ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span 
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isFullscreen ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Start Button */}
          <button
            onClick={() => {
              if (!isFullscreen) {
                document.documentElement.requestFullscreen().then(() => {
                  setIsFullscreen(true)
                  setTimeout(startUpdate, 500)
                }).catch(() => {
                  startUpdate()
                })
              } else {
                startUpdate()
              }
            }}
            className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/30"
          >
            Start Fake Update
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
          <h3 className="text-gray-300 text-sm font-medium mb-2">📋 Instructions</h3>
          <ul className="text-gray-500 text-xs space-y-1">
            <li>• Set the desired duration for the fake update</li>
            <li>• Enable fullscreen for maximum effect</li>
            <li>• Press ESC anytime to exit the prank</li>
            <li>• Leave your friend's computer and watch! 😈</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-6">
        This is a harmless joke app. No actual changes are made to the system.
      </p>
    </div>
  )
}

export default App
