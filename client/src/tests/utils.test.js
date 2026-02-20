import { describe, it, expect, vi } from 'vitest'

describe('apiFetch', () => {
  it('should be importable', async () => {
    const mod = await import('../lib/api')
    expect(mod.apiFetch).toBeDefined()
    expect(typeof mod.apiFetch).toBe('function')
  })

  it('adds Authorization header when token present', async () => {
    const { apiFetch } = await import('../lib/api')

    // Mock localStorage token
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }))
    localStorage.setItem('cloudspace_token', 'test-token-123')

    await apiFetch('/api/test')

    const calls = fetch.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    const headers = calls[0][1]?.headers || {}
    expect(headers['Authorization']).toBe('Bearer test-token-123')

    localStorage.removeItem('cloudspace_token')
    vi.restoreAllMocks()
  })
})
