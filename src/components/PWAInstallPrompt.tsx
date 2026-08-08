'use client'
import { useEffect, useState } from 'react'
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA Service Worker registered:', reg.scope))
        .catch((err) => console.warn('Service Worker registration failed:', err))
    }

    // 2. Check if already running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // 3. Listen to beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Check if user dismissed previously in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed')
      if (!dismissed) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Fallback timer: Show banner after 3 seconds if not installed to guide users
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed')
      if (!isStandalone && !dismissed) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        setInstalledSuccess(true)
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    } else {
      // Guide user if browser prompt is controlled by OS/Browser policy
      alert('To install Lease360 on your device:\n\n• Chrome/Edge: Click the Install icon in the address bar or Menu (⋮) → "Install Lease360"\n• iOS Safari: Tap Share (⎋) → "Add to Home Screen"')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    sessionStorage.setItem('pwa_prompt_dismissed', 'true')
  }

  if (isInstalled || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#111111]/95 backdrop-blur-md border border-[#F26522]/40 rounded-2xl p-4 shadow-2xl shadow-black/80 flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#F26522]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-10 h-10 rounded-xl bg-[#F26522]/20 border border-[#F26522]/40 flex items-center justify-center shrink-0 text-[#F26522]">
          <Smartphone size={20} />
        </div>

        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold text-sm tracking-tight">Install Lease360 App</h4>
            <span className="bg-[#F26522] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">PWA</span>
          </div>
          <p className="text-white/60 text-xs mt-1 leading-snug">
            Add Lease360 to your home screen for fast offline access & 1-click rental dispatch.
          </p>

          <div className="flex items-center gap-2.5 mt-3">
            <button
              onClick={handleInstallClick}
              className="bg-[#F26522] hover:bg-[#e05510] active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F26522]/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Install Now</span>
            </button>

            <button
              onClick={handleDismiss}
              className="text-white/40 hover:text-white text-xs font-medium px-2.5 py-2 transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 absolute top-3 right-3 cursor-pointer"
          aria-label="Close install prompt"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
