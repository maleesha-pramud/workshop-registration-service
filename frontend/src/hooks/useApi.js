import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Loads data from the API and tracks loading/error state.
 *
 *   const { data, meta, loading, error, reload } = useApi(() => workshopsApi.list(params), [params])
 *
 * - `deps` are compared by value; when they change (or `reload()` is called) the request re-runs.
 * - A response from an older request is ignored, so fast filter changes can't show stale results.
 * - While reloading, the previous `data` stays available (`loading` is true), so lists don't flash empty.
 */
export function useApi(fetcher, deps = []) {
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, meta: null, error: null })
  const fetcherRef = useRef(fetcher)
  const requestKey = `${JSON.stringify(deps)}#${reloadCount}`

  useEffect(() => {
    fetcherRef.current = fetcher
  })

  useEffect(() => {
    let stale = false
    fetcherRef
      .current()
      .then((res) => {
        if (!stale)
          setResult({ key: requestKey, data: res?.data ?? res, meta: res?.meta ?? null, error: null })
      })
      .catch((error) => {
        if (!stale) setResult((prev) => ({ ...prev, key: requestKey, error }))
      })
    return () => {
      stale = true
    }
  }, [requestKey])

  const reload = useCallback(() => setReloadCount((n) => n + 1), [])

  // Loading until a result arrives for the *current* request.
  const loading = result.key !== requestKey
  return {
    data: result.data,
    meta: result.meta,
    loading,
    error: loading ? null : result.error,
    reload,
  }
}
