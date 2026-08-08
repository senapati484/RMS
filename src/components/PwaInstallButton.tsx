'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true

export default function PwaInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [iosHint, setIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setDeferred(null)
      setIosHint(false)
    }
    const onAppInstalled = () => {
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('appinstalled', onAppInstalled)

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    if (isIos && !isStandalone()) {
      setIosHint(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === 'accepted') setDeferred(null)
  }

  if (dismissed || isStandalone()) return null

  if (!deferred && !iosHint) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 z-50">
      <div className="liquid-glass border border-white/10 rounded-2xl shadow-2xl p-3 flex items-center gap-3 max-w-[280px]">
        <img
          src="/icons/icon-96.png"
          alt="Lease360"
          className="w-10 h-10 rounded-xl bg-white/10 ring-1 ring-white/20 shrink-0"
        />
        {deferred ? (
          <>
            <div className="flex-1">
              <div className="text-white text-xs font-bold">Install Lease360</div>
              <div className="text-white/40 text-[10px]">Get the app on your home screen</div>
            </div>
            <button
              onClick={handleInstall}
              className="bg-[#F26522] hover:bg-[#e05510] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download size={13} />
              Install
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <div className="text-white text-xs font-bold">Add to Home Screen</div>
              <div className="text-white/40 text-[10px] leading-relaxed">
                Tap Share <span className="text-white/70">↗</span> then &quot;Add to Home Screen&quot;
              </div>
            </div>
          </>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-white/30 hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
