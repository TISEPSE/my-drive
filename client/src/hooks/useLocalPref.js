import { useState, useEffect } from 'react'

export function useLocalPref(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.key === key) setValue(e.detail.value)
    }
    window.addEventListener('localPrefChange', handler)
    return () => window.removeEventListener('localPrefChange', handler)
  }, [key])

  const set = (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
    window.dispatchEvent(new CustomEvent('localPrefChange', { detail: { key, value: newValue } }))
    setValue(newValue)
  }

  return [value, set]
}
