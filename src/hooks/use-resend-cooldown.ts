"use client"

import { useEffect, useState } from "react"

const DEFAULT_SECONDS = 60

/** Contador para reenviar OTP (segundos restantes; 0 = puede reenviar). */
export function useResendCooldown(initialSeconds = DEFAULT_SECONDS) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const id = window.setTimeout(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => window.clearTimeout(id)
  }, [remaining])

  function start(seconds = initialSeconds) {
    setRemaining(seconds)
  }

  return {
    remaining,
    start,
    canResend: remaining <= 0,
  }
}
